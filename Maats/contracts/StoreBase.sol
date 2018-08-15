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
  event LogStoreClosed(address indexed _ownerAddress, string _oldStoreName);

  Store[] allStores;

  /// @dev The Store struct is used to represent all stores in the Maats Network.
  struct Store{
    // Acts as unique identifier.
    string storeName;
    // Structs can't store struct array's so mapping is used instead.
    mapping(uint => Product) products;
    // Stores can only have 5 admins. The 0-index is reserved for store owner.
    address[6] storeAdmins;
    // Acts as the key for the products mapping. NOTE: max num prod = 256: SCALABILITY :/
    uint prodCount;
  }


  /// @dev Products are members of Stores. Each new product an owner adds to
  /// their store takes the following form.
  struct Product{
    uint128 price;
    // Array of the enum to track instances of this product type. This allows
    // for a product to be sold for a set price or sold at auction. It also
    // tracks progress of an instance so the owner knows when to ship an item.
    ItemStatus[] items;
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


  /// @dev Mapping accessing the store owned by a specific owner address.
  mapping (address => Store) public OwnerToStore;

  /// @dev Need a way to access the address of the store owner for functions
  /// where store admins are acting upon the store and not the owner.
  mapping(string => address)  StoreNameToOwner;

  /// @dev Used to ensure an address isn't registered as an owner multiple times
  /// accessed when loading a page to allow access to owner only functionality.
  mapping (address => bool) public isStoreOwner;

  /// @dev Used to ensure that an owner has only created a single store as
  /// owners are only allowed to manage a single store.
  mapping (address => bool) public createdStore;

  /// @dev Used to ensure that store names remain unique identifiers for Store
  /// structs and to ensure that a only existing stores are acted upon.
  mapping(string => bool) storeExists;

  /// @dev give admins access to stores instead of requiring the owner address
  mapping (address => Store) storeAdminToStore;



  /// @dev Function for testing store creation and removal since
  /// mappings with dynamic keys don't yet have public getter functions
  function getStoreExists(string _storeName)public constant returns(bool){
    return storeExists[_storeName];
  }

  /// @dev This function associates an address with a store owner. It DOES NOT
  /// create the store for the owner. An Address must be a store owner before
  /// they can create a Store instance.
  /// @param _newOwner : Address of the new owner candidate
  /// @return The ownerId for the StoreOwner array
  function makeStoreOwner(address _newOwner,string _storeName)
    public
    onlyMaatsLeadership
    whenNotPaused{
      require(isStoreOwner[_newOwner] == false);

      isStoreOwner[_newOwner] = true;

      createStore(_newOwner, _storeName);

      emit LogNewStoreOwner(_newOwner);

    }

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
      onlyMaatsLeadership // consider requiring this to be a multisig event
      returns(bool){
        // throw if this address isn't an owner
        address owner = StoreNameToOwner[_storeName];
        require(isStoreOwner[owner] == true);

        // free the store name for future use
        storeExists[_storeName] = false;

        // remove ownership of _badOwner's store
        // set the status of the store to closed
        OwnerToStore[owner].storeName = "0";
        emit LogStoreClosed(owner,OwnerToStore[owner].storeName);
        isStoreOwner[owner] = false;

        emit LogStoreOwnerRemoved(owner);
        return(isStoreOwner[owner]);
      }

    /// @dev Requries that the msg.sender is a storeOwner. It checks to ensure
    /// that the msg.sender hasn't created a store yet and that the storeName
    /// they choose hasn't already been taken by another owner.
    /// @param _storeName : The string used as the unique identifier for the Store.
    /// @return _newStore.storeName: returns the name of the new store.
    function createStore(address _newOwner, string _storeName)
      internal
      whenNotPaused
      returns(string){
        // Check that msg.sender is registered as a store owner.
        require(isStoreOwner[_newOwner] == true);
        // Require that they don't have a store yet.
        require(createdStore[_newOwner] == false);
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
        OwnerToStore[_newOwner] = _newStore;
        // Ensure we can access the owner from the store's unique identifier.
        StoreNameToOwner[_newStore.storeName] = _newOwner;
        // Register this name to ensure another owner can't take this name
        storeExists[_newStore.storeName] = true;
        // 0-index is reserved for store owner. Can only change during owner transfer
        _newStore.storeAdmins[0] = _newOwner;
        storeAdminToStore[_newOwner] = _newStore;
        // Record the store creation so that the owner can't create another store
        createdStore[_newOwner] = true;

        allStores.push(_newStore);


      //  emit LogNewStore(msg.sender, _newStore.storeName);

        return(_newStore.storeName);
    }

    function getStoreName(uint i) public constant returns(string){
      if(allStores.length != 0){
        Store storage _store = allStores[i];
        string storage storeName = _store.storeName;
        return storeName;
      }
      return "0";
    }

    function getNumStores() public constant returns(uint){
      return allStores.length;
    }


}
