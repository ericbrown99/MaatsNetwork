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


    /// @dev Allows us to see the properties of a product
    function getProduct(string _storeName, uint productId)
      public
      view
      returns(
        uint128 _price,
        uint64 _inventory,
        bool _auction
        ){
          address _owner = StoreNameToOwner[_storeName];
          Store storage _store = OwnerToStore[_owner];
          Product storage _product = _store.products[productId];
          _price = _product.price;
          _inventory = _product.inventory;
          _auction = _product.auction;
        }


  }
