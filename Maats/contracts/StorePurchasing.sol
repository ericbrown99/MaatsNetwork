pragma solidity ^0.4.24;

import "./StoreManagement.sol";
/*import "./Auction/ClockAuctionBase.sol";
import "./Auction/ClockAuction.sol";*/
import "../importedContracts/payment/Escrow.sol";


/* @dev This contract is used to manage the purchasing process for set price
 * products. It also manages payments through an escrow contract.  When owner's
 * or admin's ship a product to the purchaser, they withdraw the deposited fund
 * from the purchase of that item. Auction items are NOT managed in this contract
*/
contract StorePurchasing is StoreManagement{

  /// @dev Let owner/admins know a product instance has been purchased
  event LogItemBought(uint8 indexed _productId, address indexed _purchaser,string _storeName);
  /// @dev Let owner/admins know they are running out or are out of a product
  event LogInventoryLow(string indexed _storeName, uint8 indexed _productId,uint64 remaining);
  event LogInventoryOut(string indexed _storeName, uint8 indexed _productId);
  /// @dev record that a purchased item has been shipped
  event LogItemShipped(uint indexed _index,uint8 indexed _productId,string _storeName);

  /// @dev address of the contract used to handle escrow services;
  Escrow public escrow;

  /// @dev Used to record the purchaser address and the item they purchased
  mapping(address => uint) public purchaserToItem;

  /// @dev set the address of the contract handling escrow services;
  /// @param _escrowAddress : The address of the contract being used
  function setEscrowAddress(address _escrowAddress) public onlyMaatsOwner {
    Escrow _escrow = Escrow(_escrowAddress);
    escrow = _escrow;
  }

  /// @dev An internal function used to store the payment in the escrow for the owner
  /// @param _payee : the address of the owner getting payed
  /// @param value : the value of msg.value in the function calling this function.
  function depositEscrow(address _payee, uint value) internal{
    // require that adequate funds are in this contract.
    require(address(this).balance >= value);
    // make deposit for the owner
    escrow.deposit.value(value)(_payee);
  }

  /// @dev An internal function which withdraws and sends funds to store owner
  /// @param _payee : the address of the store owner getting payed.
  function withdrawEscrow(address _payee, uint72 _payment) internal{
    escrow.withdraw(_payee,_payment);
  }

  // this could get expensive, lead to security weaknesses, consider method with
  // index count of first "forSale" item. Make public for testing
  function findFirstItemForSale(uint8 _productId, string _storeName) public view returns(uint){
    bool found = false;
    uint index;
    address _owner = StoreNameToOwner[_storeName];
    uint storeId = storeAdminToStoreId[_owner];
    Store storage _store = storeIdToStore[storeId];
    for(uint i; i < _store.products[_productId].items.length && found == false; i++){
      if(_store.products[_productId].items[i] == ItemStatus.ForSale){
        index = i;
        found = true;
      }
    }
    // want to avoid silent failure and subsequent inappropriate decrement of inventory
    assert(found == true);
    return index;
  }


  /// @dev This payable function allows customers to buy products from a store
  /// It requires that the value sent in msg.value is greater than the price
  /// of the product. It calls internal function depositEscrow. It will also
  /// emit events to let owner/admins know if their inventory is (almost) out
  /// @param _productId : the product type being purchased
  /// @param _storeName : the unique identifer for the store which sells the product
  /// @return index : The location of the item instance being purchased
  function buyItem(uint8 _productId,string _storeName)
    public
    payable
    whenNotPaused
    returns (uint index){
      // get address of store owner to be accessed in depositEscrow
      address _storeOwner = StoreNameToOwner[_storeName];
      uint storeId = OwnerToStoreId[_storeOwner];
      Store storage _store = storeIdToStore[storeId];

      // calls internal function to find first product instance ForSale
      index = findFirstItemForSale(_productId, _storeName);

      // require funds sent are adequate
      uint value = msg.value;
      require(value >= _store.products[_productId].price);
      depositEscrow(_storeOwner, value);

      _store.products[_productId].items[index] = ItemStatus.Bought;
    //  emit LogItemBought( _productId, msg.sender, _store.storeName);
      purchaserToItem[msg.sender] = index;

      // update the inventory of the product type
      _store.products[_productId].inventory--;
      uint64 remaining = _store.products[_productId].inventory;
      if(remaining <=5){
        if(remaining ==0){
        //  emit LogInventoryOut(_store.storeName,_productId);
        }
      //  emit LogInventoryLow(_store.storeName, _productId, remaining);
      }
  }

  /// @dev Once an item is logged as bought, the store owner/admin can ship the
  /// item and use this function to log it has been shipped. When Item is shipped,
  /// the owner receives their deposits from escrow.
  /// notice: right now there is a !!SECURITY!! concern becuase if the owner
  /// has several items "bought" but not sold, they could withdraw total deposited
  /// funds by shipping only one item. Should edit escrow contract to prevent.
  /// @param _itemIndex : the instance of the item to be shipped
  /// @param _productId : the product type to which the instance belongs
  /// @return shipped : simply confirms that the product has infact been shipped.
  /// WOULD LOVE TO USE ORACLE HERE FROM SHIPPING COMPANIES!!!!
  function shipItem(uint _itemIndex,uint8 _productId)
    public
    whenNotPaused
    onlyStoreAdmin
    returns(bool shipped){
      uint storeId = storeAdminToStoreId[msg.sender];
      Store storage current = storeIdToStore[storeId];
      require(current.products[_productId].items[_itemIndex] == ItemStatus.Bought);
      shipped = false;
      uint72 payment = current.products[_productId].price;
      // would be great to use an oracle here to check that UPS has received the package
      // for now will let store leadership change the status of the item to shipped
      current.products[_productId].items[_itemIndex] = ItemStatus.Shipped;
      shipped = true;
      emit LogItemShipped(_itemIndex, _productId, current.storeName);

      withdrawEscrow(StoreNameToOwner[current.storeName], payment);
    }
}
