pragma solidity ^0.4.24;

import "./StoreBase.sol";

/** @dev Contract for storeOwner management. This includes product management,
  * store closure by owner and store removal by owner. This contract also
  * manages product inventory and specific instances of a product type.
  */
contract StoreManagement is StoreBase{

  /// @dev Emit when a product with set price is created.
  event LogNewSetPriceProduct(uint _productId,string indexed _storeName);
  /// @dev Emit when inventory of a product is increased.
  event LogAddedInventory(uint indexed _productId,uint64 inventory);
  /// @dev Emit when a product is no longer being sold
  event LogProductRemoved(address indexed _ownerAddress,string indexed _storeName);
  /// @dev Let the world know of price changes
  event LogPriceChange(uint indexed _productId,string indexed _storeName,uint128 _newPrice);
  /// @dev Emit when an admin is added to a store
  event LogNewAdmin(string indexed _storeName,address adminAddress);
  /// @dev Emit when an admin is removed from a store
  event LogAdminRemoved(string indexed _storeName,address adminAddress);




  /// @dev Uses current store to determine if they are an admin, allowing them to
  /// act on the store for which they are an admin. Recall that the 0-index
  /// of the storeAdmins array holds the owner address. Therefore any function
  /// which uses this modifier can be also accessed by the owner!
  modifier onlyStoreAdmin(){
    Store storage current = storeAdminToStore[msg.sender];

    // if current isn't equal to a store, then the following require fails
    require(storeExists[current.storeName]);
    _;
  }

  /// @dev Uses store mappings to determine if the msg.sender is the owner.
  modifier onlyStoreOwner(){
    Store storage current = OwnerToStore[msg.sender];
    require(storeExists[current.storeName]);
    _;
  }


/*
***** Store Admin Management *****
*/

  // used for testing purposes
  mapping (address => bool) isStoreAdmin;
  function getIsStoreAdmin(address adminAddress)public constant returns(bool){
    return isStoreAdmin[adminAddress];
  }

  /// @dev Allow the store owner or its admins to add another admin to the store.
  /// The function checks that the address isn't already an admin and ensures that
  /// there aren't already admins. It starts at index 1 since index 0 is always
  /// for the store owner.
  /// @param _NewAdminAddress : address of the soon to be admin.
  function createStoreAdmin(address _NewAdminAddress)
  public
  whenNotPaused
  onlyStoreAdmin{
    // retrieve the store based off of who is calling.
    Store storage current = storeAdminToStore[msg.sender];

    bool adminCreated = false;
    for(uint i=1; i <= 5 && adminCreated == false; i++){
      if (current.storeAdmins[i] == 0){
        current.storeAdmins[i] = _NewAdminAddress;
        adminCreated = true;
        isStoreAdmin[_NewAdminAddress] = true;
      }
    }


    // This assert is used to prevent a silent failure of this function call
    assert(adminCreated == true);

  ///emit LogNewAdmin(current.storeName, _NewAdminAddress);
  }

  /// @dev This function removes an admin from the store. It can only be called
  /// by the owner of the store. The admin array isn't restructured because
  /// the order of admins is insignificant outside of the 0-index == owner.
  /// @param _adminAddress : the address of the admin being removed.
  function removeStoreAdmin(address _adminAddress)
  public
  onlyStoreOwner
  whenNotPaused{
    Store storage current = storeAdminToStore[msg.sender];
    bool adminRemoved = false;
    uint i = 1;
    // start at 1-index because the 0-index is reserved for the owner
    for(; i<=5 && adminRemoved == false; i++){
      if(current.storeAdmins[i] == _adminAddress){
        current.storeAdmins[i] = 0;
        adminRemoved = true;
        isStoreAdmin[_adminAddress] = false;
      }
    }

    // want to sensure there isn't a silent failure of this function call.
     assert(adminRemoved == true);

  //  emit LogAdminRemoved(current.storeName, _adminAddress);
  }

/*
****** Product Management *****
*/

  /// @dev Only used for testing. GetProductExists really only checks if there
  /// is  a product in the array at prodCount
  mapping (uint => bool) productExists;
  function getProductExists(address ownerAddress)public constant returns(bool){
    Store storage current = storeAdminToStore[ownerAddress];
    return productExists[current.prodCount -1];

  }
  /// @dev This function creates a new product which is sold for a set price.
  /// It is added to the products mapping for the store and can only be accessed
  /// when the contract isn't paused. Security concerns are present if an
  /// owner acts maliciously and attempts to add hundreds of products to slow
  /// down Maats Network and cause errors
  /// notice: immediately makes product forSale
  /// @param _price : the price of the new product
  /// @param _inventory : the initial inventory the store has on hand of the product
  /// @return _productId : returns the key for the products mapping.
  function createSetPriceProduct(
    uint128 _price,
    uint64 _inventory
    )
    public
    whenNotPaused
    onlyStoreAdmin
    returns(uint _productId){
      // fetch current store based off of the msg.sender
      Store storage current = storeAdminToStore[msg.sender];

      // the product will be stored in the products mapping as to avoid
      // dissapearing during deallocation of local memory variables.
      Product memory _product = Product({
        price: _price,
        items: new ItemStatus[](0),
        inventory: _inventory,
        auction: false
        });

      // The identifier for a product is equal to the current count of products
      // before this product was created. It is then added to the mapping and
      // the count of total products in the store is incremented.
      _productId = current.prodCount;
      current.products[_productId] = _product;
      productExists[current.prodCount] = true;
      current.prodCount++;

      // fill the items array with initial inventory and set to ForSale
      for(uint i; i <_inventory; i++){
        current.products[_productId].items.push(ItemStatus.ForSale);
      }

      // Let the world know there's a new product on the store!!
    //  emit LogNewSetPriceProduct(_productId, current.storeName);
      return(_productId);
    }

  // Just for testing
  function getCurrentInventory(address ownerAddress) public constant returns(uint64){
    Store storage current = storeAdminToStore[ownerAddress];
    return current.products[0].inventory;
  }

  /// @dev Add inventory to a product and manage inventory variables.
  /// notice Added inventory for set-price becomes for sale immediatley
  /// Can't add inventory for auctions, new product created instead
  /// @param _productId : the product type which is getting new inventory
  /// @param _newInventory : the amount of new inventory being added
  /// @return current.products[_productId].inventory : the now total inventory
  function addInventory(uint _productId,uint64 _newInventory)
    public
    onlyStoreAdmin
    whenNotPaused
    returns(uint64){
      // fetch current store based off of msg.sender
      Store storage current = storeAdminToStore[msg.sender];
      // add the new inventory to the current amount of inventory
      current.products[_productId].inventory += _newInventory;
      // Ensure that product isn't of type auction since you can't add inventory
      // to a single item on auction.
      bool _isAuction = current.products[_productId].auction;
      require(_isAuction == false);

      // immediately set new inventory up for sale.
      for(uint i; i <_newInventory; i++){
        current.products[_productId].items.push(ItemStatus.ForSale);
      }

      emit LogAddedInventory(_productId, current.products[_productId].inventory);
      return(current.products[_productId].inventory);
  }

  function getCurrentPrice(address storeOwnerAddress)public constant returns(uint128){
    Store storage current = storeAdminToStore[storeOwnerAddress];
    return current.products[0].price;
  }
  /// @dev Change the price of an existing product. Ensure that the new price
  /// is not larger than 0 (0 is allowed if people are feeling generous).
  /// notice You can't change the price of an auction item since those items
  /// follow their own logic.
  /// @param _newPrice : the new price for the product
  /// @param _productId : the product which is experiencing the price change.
  function changePrice(uint128 _newPrice,uint _productId)
    public
    onlyStoreOwner
    whenNotPaused
    returns(uint128){
      Store storage current = storeAdminToStore[msg.sender];
      require(_newPrice >= 0);
      // can't change the price of an auction item
      require(current.products[_productId].auction == false);
      // change price
      current.products[_productId].price = _newPrice;
      // Let the world know about the price change!!
    //  emit LogPriceChange(_productId, current.storeName, _newPrice);
      return(_newPrice);
  }

  function getStoreAdmins(uint index,string storeName)public constant returns(address){
    require(index >=1 && index <=5);
    address owner = StoreNameToOwner[storeName];
    Store storage _store = OwnerToStore[owner];
    if(_store.storeAdmins.length > 0){
      return(_store.storeAdmins[index]);
    }
    return(address(0));
  }

  function getNumProducts(string _storeName) public constant returns(uint){
    require(storeExists[_storeName]);
    address _owner = StoreNameToOwner[_storeName];
    Store storage _store = OwnerToStore[_owner];
    return(_store.prodCount);
  }

  function getProductType(uint _productId,string _storeName) public constant returns(bool){
    require(storeExists[_storeName]);
    address _owner = StoreNameToOwner[_storeName];
    Store storage _store = OwnerToStore[_owner];
    Product storage _product = _store.products[_productId];
    return(_product.auction);
  }

  function getOwnerFromName(string _storeName) public constant returns(address){
    address _owner = StoreNameToOwner[_storeName];
    return(_owner);
  }

}
