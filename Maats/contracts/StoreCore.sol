pragma solidity ^0.4.24;

import "./StoreAuction.sol";

/**
  * @dev This contract represents a store in the Maat's network of stores. It
  * is deployed from the StoreFactory contract
  * @author Eric Brown (https://github.com/ericbrown99)
  */

  contract StoreCore is StoreAuction {
    /*  Needs to be implemented:
        - This is the core contract which manages all of the subcontracts. Use
          this contract to create the constructor and implement upgradable
          design patterns
        - Manage
        - Lookup function to find the addreses of owners associated with stores so
          that Maats leadership can act on stores which aren't active
    */

    // For upgradeability
    address public newContractAddress;
    // emit event if funds donated to contract (don't take cut of sales)
    event LogFundsReceived(address indexed _sender,uint _value);

    /// @dev set the pause vaiable to true when creating the contract. THe owner
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

    /// @dev used for testing to confimr that maats admins are infact added to array
    function getIsAdmin(address _admin) public constant whenNotPaused returns(bool){
      return isMaatsAdmin[_admin];
    }

    /// @dev Function for testing store creation and removal since
    /// mappings with dynamic keys don't yet have public getter functions
    function getStoreExists(string _storeName)public constant returns(bool){
      return storeExists[_storeName];
    }

    /// @dev get the store name
    function getStoreName(uint i) public constant returns(string){
      if(currentStoreCount != 1){
        Store storage _store = storeIdToStore[i];
        string storage storeName = _store.storeName;
        return storeName;
      }
      return "0";
    }

    /// @dev get store admins
    function getIsStoreAdmin(address adminAddress)public constant returns(bool){
      return (storeAdminToStoreId[adminAddress] != 0);
    }

    /// @dev If price ==0 its assumed it no longer exists
    function getProductExists(string storeName,uint8 productId)public constant returns(bool){
      address owner = StoreNameToOwner[storeName];
      uint storeId = storeAdminToStoreId[owner];
      Store storage current = storeIdToStore[storeId];
      return (current.products[productId].price != 0);
    }

    // get current inventory of product
    function getCurrentInventory(string storeName, uint8 productId) public constant returns(uint64){
      address owner = StoreNameToOwner[storeName];
      uint storeId = storeAdminToStoreId[owner];
      Store storage current = storeIdToStore[storeId];
      return current.products[productId].inventory;
    }

    // get current price of a set auction price
    function getCurrentSetPrice(string storeName,uint8 productId)public constant returns(uint72){
      address owner = StoreNameToOwner[storeName];
      uint storeId = storeAdminToStoreId[owner];
      Store storage current = storeIdToStore[storeId];
      return current.products[productId].price;
    }

    // get admins of a store
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


    function getNumProducts(string _storeName) public constant returns(uint){
      require(storeExists[_storeName]);

      address _owner = StoreNameToOwner[_storeName];
      uint storeId = OwnerToStoreId[_owner];
      Store storage _store = storeIdToStore[storeId];
      return(_store.prodCount);
    }

    function getProductType(uint8 _productId,string _storeName) public constant returns(bool){
      require(storeExists[_storeName]);
      address _owner = StoreNameToOwner[_storeName];
      uint storeId = OwnerToStoreId[_owner];
      Store storage _store = storeIdToStore[storeId];
      Product storage _product = _store.products[_productId];
      return(_product.auction);
    }

    function getOwnerFromName(string _storeName) public constant returns(address){
      address _owner = StoreNameToOwner[_storeName];
      return(_owner);
    }

    ///////// Purchasing

    /// @dev for testing purchasing
    function getPurchase(address _purchaser)public constant returns(uint){
      return purchaserToItem[_purchaser];
    }

    /// @dev for testing successful ship of item
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

    function getAuctionExists(uint auctionId)public constant returns(uint64){
      uint64 currentTime = auctionIdToAuction[auctionId].startedAt;
      if(currentTime != 0){
        return currentTime;
      }else{
        return 0;
      }
    }

    function getCurrentPrice(uint auctionId)
        public
        view
        returns (uint256)
    {
        Auction storage auction = auctionIdToAuction[auctionId];
        require(_isOnAuction(auction));
        return _currentPrice(auction);
    }

    function getDuration(uint auctionId)public constant returns(uint){
      Auction storage auction = auctionIdToAuction[auctionId];
      return (auction.duration);
    }
    function getReservePrice(uint auctionId) public constant returns(uint){
      Auction storage auction = auctionIdToAuction[auctionId];
      return auction.endingPrice;
    }

    function getItemLength(string storeName, uint8 productId)public constant returns(uint){
      address owner = StoreNameToOwner[storeName];
      uint storeId = OwnerToStoreId[owner];
      return storeIdToStore[storeId].products[productId].items.length;
    }

    function getItemBought(string storeName, uint8 productId, uint index) public constant returns(bool){
      address owner = StoreNameToOwner[storeName];
      uint storeId = OwnerToStoreId[owner];
      Store storage current = storeIdToStore[storeId];
      ItemStatus _status = current.products[productId].items[index];
      return(_status == ItemStatus.Bought);
    }

    function getAuctionId(string StoreName, uint8 productId) public constant returns(uint){
      return(storeNameToAuctionId[StoreName][productId]);
    }


  }
