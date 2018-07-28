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

  /// @dev array of StoreOwners to record the addresses and reviews of owners
  /// couldn't you just turn this into a mapping from address to review?
  StoreOwner[] public storeOwners;

  /// @dev The Store struct is used to represent all stores in the Maats Network.
  struct Store{
    // Acts as unique identifier.
    string storeName;
    // Structs can't store struct array's so mapping is used instead.
    mapping(uint8 => Product) products;
    // Open or closed. Owner can modify this if they want to make updates.
    bool open;
    // Stores can only have 5 admins. The 0-index is reserved for store owner.
    address[6] storeAdmins;
    // Acts as the key for the products mapping. NOTE: max num prod = 256: SCALABILITY :/
    uint8 prodCount;
  }

  /// @dev ake owner array and create ownerId to improve access to stores
  /// create mapping which pairs stores to storeId's
  struct StoreOwner{
    address ownerAddress; //this controls functionality, make sure not accessible
    uint128 ownerRanking;
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
  function makeStoreOwner(address _newOwner)
    public
    onlyMaatsLeadership
    whenNotPaused
    returns (uint){
      require(isStoreOwner[_newOwner] == false);
      StoreOwner memory _storeOwner = StoreOwner({
        ownerAddress: _newOwner,
        ownerRanking: 0 // not placed on front end until threshold # reviews
        });

      // StoreOwner recorded with identifier
      // needs to be part of a mapping to not deallocate
      uint256 storeOwnerId = storeOwners.push(_storeOwner) -1;

      isStoreOwner[_newOwner] = true;

      emit LogNewStoreOwner(_newOwner);

      return(storeOwnerId);
    }

    /// @dev Used to remove an owner from the isStoreOwner mapping and prevent
    /// the specified address from accessing store owner functions on Maat's.
    /// It also closes the store for which they are the owner.
    /// notice This doesn't have a pausible modifier since we want to be able
    /// to remove an owner when paused in the case they are acting maliciously
    /// as opposed to simple inactivity or other violations.
    /// @param _badOwner : The address being removed
    /// @return The value of the mapping which states if they are a store owner
    function removeStoreOwner(address _badOwner)
      public
      onlyMaatsLeadership // consider requiring this to be a multisig event
      returns(bool){
        // throw if this address isn't an owner
        require(isStoreOwner[_badOwner] == true);

        // remove ownership of _badOwner's store
        // set the status of the store to closed
        OwnerToStore[_badOwner].open = false;
        emit LogStoreClosed(_badOwner,OwnerToStore[_badOwner].storeName);

        isStoreOwner[_badOwner] = false;
        emit LogStoreOwnerRemoved(_badOwner);
        return(isStoreOwner[_badOwner]);
      }

    /// @dev Requries that the msg.sender is a storeOwner. It checks to ensure
    /// that the msg.sender hasn't created a store yet and that the storeName
    /// they choose hasn't already been taken by another owner.
    /// @param _storeName : The string used as the unique identifier for the Store.
    /// @return _newStore.storeName: returns the name of the new store.
    function createStore(string _storeName)
      public
      whenNotPaused
      returns(string){
        // Check that msg.sender is registered as a store owner.
        require(isStoreOwner[msg.sender] == true);
        // Require that they don't have a store yet.
        require(createdStore[msg.sender] == false);
        // Require that the name for their store hasn't been taken.
        require(storeExists[_storeName] == false);

        // Fixed size array's need to be in memory before definition in structs
        // This will be the storeAdmin array in the new store.
        address[6] memory newArray;

        // Create the new store type in memory. It will be stored in the
        // OwnerToStore mapping as to not be lost during deallocation
        Store memory _newStore = Store({
          storeName: _storeName,
          open: false,
          storeAdmins: newArray,
          prodCount: 0
          });

        // This mapping stores the newStore in contract storage
        OwnerToStore[msg.sender] = _newStore;
        // Ensure we can access the owner from the store's unique identifier.
        StoreNameToOwner[_newStore.storeName] = msg.sender;
        // Register this name to ensure another owner can't take this name
        storeExists[_newStore.storeName] = true;
        // 0-index is reserved for store owner. Can only change during owner transfer
        _newStore.storeAdmins[0] = msg.sender;
        storeAdminToStore[msg.sender] = _newStore;
        // Record the store creation so that the owner can't create another store
        createdStore[msg.sender] = true;

      //  emit LogNewStore(msg.sender, _newStore.storeName);

        return(_newStore.storeName);
    }

}
