pragma solidity ^0.4.24;

import "./StoreAuction.sol";

/**
  * @dev This contract represents a store in the Maat's network of stores. It
  * is deployed from the StoreFactory contract
  * @author Eric Brown (https://github.com/ericbrown99)
  */

  contract StoreCore is StoreAuction {


    // For upgradeability
    address public newContractAddress;
    // emit event if funds donated to contract (don't take cut of sales)
    event LogFundsReceived(address indexed _sender,uint _value);

    /// @dev set the pause variable to true when creating the contract. The owner
    /// must ensure that the proper escrow contract is linked to the contract
    /// and that the proxy has connected to the contract before unpausing the
    /// contract as a security measure.
    constructor() public{
      pause = true;
      maatsOwner == msg.sender;
    }

    /// @dev Fall back function with donations allowed
    function() external payable{
      if (msg.value >= 0){
        emit LogFundsReceived(msg.sender, msg.value);
      }
    }

    /* *****
    /* All Getter Functions for the front end
    /* ***** */

    /// @dev used for testing to confirm that maats admins are infact added to array
    /// @param _admin The address of the admin which is being tested
    function getIsAdmin(address _admin) public constant whenNotPaused returns(bool){
      return isMaatsAdmin[_admin];
    }

    /// @dev Function for testing store creation and removal since
    /// mappings with dynamic keys don't yet have public getter functions
    /// @param _storeName The name of the store which acts as a unique identifer
    function getStoreExists(string _storeName)public constant returns(bool){
      return storeExists[_storeName];
    }

    /// @dev get the store name from the mapping of stores using its ID
    /// @param storeId The Id of the store being tested
    function getStoreName(uint storeId) public constant returns(string){
      if(currentStoreCount != 1){
        Store storage _store = storeIdToStore[storeId];
        string storage storeName = _store.storeName;
        return storeName;
      }
      return "0";
    }

    /// @dev get store admins for the front end. This is part of a javascript loop
    /// checking that the current account is an admin of the store
    /// @param adminAddress  The address being tested as an admin
    function getIsStoreAdmin(address adminAddress)public constant returns(bool){
      return (storeAdminToStoreId[adminAddress] != 0);
    }

    /// @dev If price == 0 its assumed it no longer exists. This can be used by
    /// store owners to remove a product from their store
    /// @param storeName The store which contains the product
    /// @param productId The id of the product which is being tested for existance
    function getProductExists(string storeName,uint8 productId)public constant returns(bool){
      address owner = StoreNameToOwner[storeName];
      uint storeId = storeAdminToStoreId[owner];
      Store storage current = storeIdToStore[storeId];
      return (current.products[productId].price != 0);
    }

    /// @dev get current inventory of a product
    /// @param storeName The store in which the product exists
    /// @param productId The product returning its inventory
    function getCurrentInventory(string storeName, uint8 productId) public constant returns(uint64){
      address owner = StoreNameToOwner[storeName];
      uint storeId = storeAdminToStoreId[owner];
      Store storage current = storeIdToStore[storeId];
      return current.products[productId].inventory;
    }

    /// @dev Get current price of a set price product
    /// @param storeName Name of the store in which the product exists
    /// @param productId The id of the product returning its price
    function getCurrentSetPrice(string storeName,uint8 productId)public constant returns(uint72){
      address owner = StoreNameToOwner[storeName];
      uint storeId = storeAdminToStoreId[owner];
      Store storage current = storeIdToStore[storeId];
      return current.products[productId].price;
    }

    /// @dev Get admins of a store. Used in a for loop in javascrip
    /// @param index of the loop in the front end used to ensure it isn't out of scope
    /// @param storeName The name of the store which is returning its admins
    function getStoreAdmins(uint index,string storeName)public constant returns(address){
      require(index >=1 && index <=5);
      address owner = StoreNameToOwner[storeName];
      uint storeId = OwnerToStoreId[owner];
      Store storage _store = storeIdToStore[storeId];
      if(_store.storeAdmins.length > 0){
        return(_store.storeAdmins[index]);
      }
      return(address(0));
    }

    /// @dev Retreiving the number of products in a specific store
    /// @param _storeName the store which is returning the number of products
    function getNumProducts(string _storeName) public constant returns(uint){
      require(storeExists[_storeName]);

      address _owner = StoreNameToOwner[_storeName];
      uint storeId = OwnerToStoreId[_owner];
      Store storage _store = storeIdToStore[storeId];
      return(_store.prodCount);
    }

    /// @dev Retreiving the type of product (ie. set price or auction)
    /// @param _productId The id of the product returning its type
    /// @param _storeName The store in which the product exists
    function getProductType(uint8 _productId,string _storeName) public constant returns(bool){
      require(storeExists[_storeName]);
      address _owner = StoreNameToOwner[_storeName];
      uint storeId = OwnerToStoreId[_owner];
      Store storage _store = storeIdToStore[storeId];
      Product storage _product = _store.products[_productId];
      return(_product.auction);
    }

    /// @dev Returns the owner address from the name of the store
    /// _storeName The store which is returning its owner's address
    function getOwnerFromName(string _storeName) public constant returns(address){
      address _owner = StoreNameToOwner[_storeName];
      return(_owner);
    }

    ///////// Purchasing

    /// @dev for testing purchasing and confirming a purchase was successful
    /// @param _purchaser The address of the purchaser
    function getPurchase(address _purchaser)public constant returns(uint){
      return purchaserToItem[_purchaser];
    }

    /// @dev for testing successful ship of item
    /// @param storeName The name of the store the item is in
    /// @param index The number of the item being checked
    /// @param productId The id of the product which was shipped
    function getItemShipped(string storeName,uint index,uint8 productId)
     public
     constant
     returns(bool){
       address owner = StoreNameToOwner[storeName];
       uint storeId = OwnerToStoreId[owner];
       Store storage current = storeIdToStore[storeId];
      if(current.products[productId].items[index] == ItemStatus.Shipped){
        return true;
      }else{
        return false;
      }
    }

    /// @dev for testing the successful creation of an auciton
    /// @param auctionId The identifier of the auction
    function getAuctionExists(uint auctionId)public constant returns(uint64){
      uint64 currentTime = auctionIdToAuction[auctionId].startedAt;
      if(currentTime != 0){
        return currentTime;
      }else{
        return 0;
      }
    }

    /// @dev get the price of an auction since price descends over time
    /// @param auctionId The unique id of the auction product
    function getCurrentPrice(uint auctionId)
        public
        view
        returns (uint256)
    {
        Auction storage auction = auctionIdToAuction[auctionId];
        require(_isOnAuction(auction));
        return _currentPrice(auction);
    }

    /// @dev get the total length of an auction
    function getDuration(uint auctionId)public constant returns(uint){
      Auction storage auction = auctionIdToAuction[auctionId];
      return (auction.duration);
    }
    /// @dev Get the reserve price of an auction product
    function getReservePrice(uint auctionId) public constant returns(uint){
      Auction storage auction = auctionIdToAuction[auctionId];
      return auction.endingPrice;
    }

    /// @dev Get the number of items of a certain product
    function getItemLength(string storeName, uint8 productId)public constant returns(uint){
      address owner = StoreNameToOwner[storeName];
      uint storeId = OwnerToStoreId[owner];
      return storeIdToStore[storeId].products[productId].items.length;
    }

    /// @dev Check if an item has been bought
    function getItemBought(string storeName, uint8 productId, uint index) public constant returns(bool){
      address owner = StoreNameToOwner[storeName];
      uint storeId = OwnerToStoreId[owner];
      Store storage current = storeIdToStore[storeId];
      ItemStatus _status = current.products[productId].items[index];
      return(_status == ItemStatus.Bought);
    }

    /// @dev Get the auction id from the store name and product Id to be used
    /// on the front end to call functions which require the auctionId
    function getAuctionId(string StoreName, uint8 productId) public constant returns(uint){
      return(storeNameToAuctionId[StoreName][productId]);
    }


  }
