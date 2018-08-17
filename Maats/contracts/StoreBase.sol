pragma solidity ^0.4.24;

import "./StoreAccessControl.sol";

/**
  * @dev Defines the storage needs to create and manage stores as well as create
  * and manage the products which are specific to stores.
  */
contract StoreBase is StoreAccessControl{

  /// @dev Store name is used as a unique identifier, used in many events.
  event LogNewStore(address indexed _ownerAddress, string indexed _newStoreName);
  event LogNewStoreOwner(address indexed _storeOwnerAddress);
  event LogStoreOwnerRemoved(address indexed _storeOwner);
  event LogStoreClosed(address indexed _ownerAddress);


  // 6 writes per struct = 20,000 * 6 = 120,000 gas ....
  /// @dev The Store struct is used to represent all stores in the Maats Network.
  struct Store{
    // Stores can only have 5 admins. The 0-index is reserved for store owner.
    address[6] storeAdmins;
    // Acts as the key for the products mapping. NOTE: max num prod = 256: SCALABILITY :/
    uint8 prodCount;
    // Acts as unique identifier.
    string storeName;
    // Structs can't store struct array's so mapping is used instead.
    mapping(uint8 => Product) products;
  }


  /// @dev Products are members of Stores. Each new product an owner adds to
  /// their store takes the following form.
  struct Product{
    // Array of the enum to track instances of this product type. This allows
    // for a product to be sold for a set price or sold at auction. It also
    // tracks progress of an instance so the owner knows when to ship an item.
    ItemStatus[] items;

    uint72 price;
    // Used to manage the inventory of the product.
    uint64 inventory;
    // If false, the product is set-price, true its an auction.
    bool auction;
  }

  /// @dev Keep track of progress of sale and type of sale of a product instance (item).
  enum ItemStatus{
    ForSale,
    ForAuction,
    Bought,
    Shipped
  }

  /// @dev acts as Id for storeIdtoStore mapping
  /// The storeID of 0 is reserved for admins/owners not applied to a store
  uint public currentStoreCount = 1;
  mapping (uint256 => Store) storeIdToStore;

  /// @dev Mapping accessing the store owned by a specific owner address.
  mapping (address => uint256) public OwnerToStoreId;

  /// @dev Need a way to access the address of the store owner for functions
  /// where store admins are acting upon the store and not the owner.
  mapping(string => address)  StoreNameToOwner;

  /// @dev Used to ensure that store names remain unique identifiers for Store
  /// structs and to ensure that a only existing stores are acted upon.
  mapping(string => bool) storeExists;

  /// SUPER EXPENSIVE MAPPING
  /// @dev give admins access to stores instead of requiring the owner address
  mapping (address => uint256) storeAdminToStoreId;



    /// @dev Used to remove an owner from the isStoreOwner mapping and prevent
    /// the specified address from accessing store owner functions on Maat's.
    /// It also closes the store for which they are the owner.
    /// notice This doesn't have a pausible modifier since we want to be able
    /// to remove an owner when paused in the case they are acting maliciously
    /// as opposed to simple inactivity or other violations.
    /// @param _storeName : The store of the owner being removed
    /// @return The value of the mapping which states if they are a store owner
    function removeStoreOwner(string _storeName)
      public
      onlyMaatsLeadership{
        // throw if this address isn't an owner
        address owner = StoreNameToOwner[_storeName];
        require(OwnerToStoreId[owner] != 0);

        // free the store name for future use
        storeExists[_storeName] = false;

        uint storeId = OwnerToStoreId[owner];
        delete storeIdToStore[storeId];

        emit LogStoreClosed(owner);
        OwnerToStoreId[owner] = 0;

        emit LogStoreOwnerRemoved(owner);
      }

    /// @dev Requries that the msg.sender is a storeOwner. It checks to ensure
    /// that the msg.sender hasn't created a store yet and that the storeName
    /// they choose hasn't already been taken by another owner.
    /// @param _storeName : The string used as the unique identifier for the Store.
    /// @return _newStore.storeName: returns the name of the new store.
    function createStore(address _newOwner, string _storeName)
      public
      onlyMaatsLeadership
      whenNotPaused
      returns(string){
        // require address doesn't already have a store
        require(OwnerToStoreId[_newOwner] == 0);
        // Require that the name for their store hasn't been taken.
        require(storeExists[_storeName] == false);

        // Fixed size array's need to be in memory before definition in structs
        // This will be the storeAdmin array in the new store.
        address[6] memory newArray;

        // Create the new store type in memory. It will be stored in the
        // OwnerToStore mapping as to not be lost during deallocation
        Store memory _newStore = Store({
          storeName: _storeName,
          storeAdmins: newArray,
          prodCount: 0
          });

        // This mapping stores the newStore in contract storage
        OwnerToStoreId[_newOwner] = currentStoreCount;
        storeAdminToStoreId[_newOwner] = currentStoreCount;
        storeIdToStore[currentStoreCount] = _newStore;
        currentStoreCount++;

        // Ensure we can access the owner from the store's unique identifier.
        StoreNameToOwner[_newStore.storeName] = _newOwner;
        // Register this name to ensure another owner can't take this name
        storeExists[_newStore.storeName] = true;
        // 0-index is reserved for store owner. Can only change during owner transfer
        _newStore.storeAdmins[0] = _newOwner;

        return(_newStore.storeName);
    }

}
