pragma solidity ^0.4.24;

import "./StorePurchasing.sol";


/**  @dev This contract is used to sell auction type items. The entire auction
  *  process is managed in this contract. It maintains use of the escrow contract
  *  to manage payments and withdrawl of funds.
  */
contract StoreAuction is StorePurchasing{

  event TestLog(uint number);
  /// @dev Emit when a new auction type product is created:
  event LogNewAuctionProduct(uint _auctionId,string indexed _storeName);
  event AuctionCreated(uint auctionId, uint256 startingPrice, uint256 endingPrice, uint256 duration);

  /// @dev Emit when a new auction executes successfully
  event AuctionSuccessful(uint8 productId, uint256 totalPrice, address winner);
  /// @dev Emit when the auction is cancelled
  event AuctionCancelled(uint auctionId);

  /// @dev Tracks all auctions in the Maats Network
  uint totalAuctions = 1;

  /// @dev trakes the Auction Id as a key for the Auction
  mapping(uint256 => Auction) auctionIdToAuction;

  /// @dev nested mapping that takes storeName and productId to return auctionId
  mapping(string => mapping(uint8 => uint256)) storeNameToAuctionId;

  /// @dev Struct for the auction type to manage auction logic
  struct Auction {
      // product owner
      address seller;
      // equal to price of product struct
      uint128 startingPrice;
      // Price (in wei) at end of auction
      uint128 endingPrice;
      // Duration (in seconds) of auction
      uint64 duration;
      // Time when auction started
      // NOTE: 0 if this auction has been concluded
      uint64 startedAt;
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

  /// @dev Internal function for auctioning products.
  /// @param _startingPrice : the starting price for the Dutch Auction
  /// @param _endingPrice : the lowest the owner want's to sell the product for
  /// @param _duration : the length of the auction
  /// @param _seller : the address of the owner selling the product
  /// @param _auctionId : the identifier for the auction
  function createAuction(
      uint256 _startingPrice,
      uint256 _endingPrice,
      uint256 _duration,
      address _seller,
      uint256 _auctionId
  )
      internal
      whenNotPaused
  {
      Auction memory auction = Auction(
          _seller,
          uint128(_startingPrice),
          uint128(_endingPrice),
          uint64(_duration),
          uint64(now)
      );
      _addAuction(_auctionId, auction);
  }

  /// @dev Adds the auction to the list of current auctions and emits event
  /// @param _auctionId : the identifier for this auction
  /// @param _auction : the acution being created
  function _addAuction(uint256 _auctionId, Auction _auction) internal {
      // Require that all auctions have a duration of
      // at least one minute. (Keeps our math from getting hairy!)
      require(_auction.duration >= 1 minutes);

      // Add auction to mapping storing auctions
      auctionIdToAuction[_auctionId] = _auction;

      // Let everyone know about the new auction!!
      emit AuctionCreated(
          uint256(_auctionId),
          uint256(_auction.startingPrice),
          uint256(_auction.endingPrice),
          uint256(_auction.duration)
      );
  }

  /// @dev Removes an auction from the system
  /// @param _auctionId : Locator for the auction to be deleted
  function _removeAuction(uint256 _auctionId) internal {
      delete auctionIdToAuction[_auctionId];
  }

  /// @dev allows the owner to cancel auction
  function _cancelAuction(uint256 _auctionId) internal {
      _removeAuction(_auctionId);
      emit AuctionCancelled(_auctionId);
  }

  /// @dev Used to view if an auction is still live
  function _isOnAuction(Auction storage _auction) internal view returns (bool) {
      return (_auction.startedAt > 0);
  }


  /// function for testing successful bid
  function didBid(address ownerofproduct,uint8 productId,uint itemId)public constant returns(bool){
    uint storeId = storeAdminToStoreId[ownerofproduct];
    Store storage current = storeIdToStore[storeId];
    if(current.products[productId].items[itemId] == ItemStatus.Bought){
      return true;
    }else{
      return false;
    }
  }
  /// @dev Allows customers to "bid" on a product: Dutch (reverse) auctions don't
  /// have bids since it goes from high price to low price. Bid is essentially buy.
  /// @param _auctionId : The auction which they will be bidding on
  /// @param _productId : Identifier for product being bid on
  function _bid(uint256 _auctionId,uint8 _productId)
      public
      payable
      whenNotPaused
      returns (uint256)
  {


      // Get a reference to the auction struct
      Auction storage auction = auctionIdToAuction[_auctionId];

      // Explicitly check that this auction is currently live.
      // (Because of how Ethereum mappings work, we can't just count
      // on the lookup above failing. An invalid _tokenId will just
      // return an auction object that is all zeros.)
      require(_isOnAuction(auction));


      // Check that the incoming bid is higher than the current
      // price
      uint256 value = msg.value;
      uint256 price = _currentPrice(auction);
      require(value >= price);

      // Grab a reference to the seller before the auction struct
      // gets deleted.
      address seller = auction.seller;


      // The bid is good! Remove the auction before sending the fees
      // to the sender so we can't have a reentrancy attack.
      _removeAuction(_auctionId);

      depositEscrow(seller,value);


      uint storeId = storeAdminToStoreId[seller];
      Store storage current = storeIdToStore[storeId];
      current.products[_productId].items[0] = ItemStatus.Bought;
      emit LogItemBought(_productId, msg.sender,current.storeName);
      // Tell the world!
      emit AuctionSuccessful(_productId, price, msg.sender);

      return price;

  }

  /// @dev Creates the auction product and immediately puts it on auction.
  /// @param _startingPrice : Price the auction will start at (highest)
  /// @param _endingPrice : Price auction will end at (lowest)
  /// @param _duration : length of the auction in seconds(determines speed of price decrease)
  /// @return _auctionId : To be used to tag auction created.
  function createAuctionProduct(
    uint256 _startingPrice,
    uint256 _endingPrice,
    uint64 _duration
    )
    public
    onlyStoreAdmin
    whenNotPaused
    returns(uint auctionId){
      // Get current store based on the msg.sender
      uint storeId = storeAdminToStoreId[msg.sender];
      Store storage current = storeIdToStore[storeId];

      // Create the new product to store in mapping
      Product memory _product = Product({
        price: uint72(_startingPrice),
        items: new ItemStatus[](0),
        inventory: 1,
        auction: true
        });

      // update product count and pruduct mappings
      uint8 _productId = current.prodCount;
      current.products[_productId] = _product;
      current.prodCount += 1;

      // Get the current seller(owner) of the product
      address seller = StoreNameToOwner[current.storeName];

      // Set the product instance as ForAuction
      current.products[_productId].items.push(ItemStatus.ForAuction);

      // Update contract auction count
      uint _auctionId =  totalAuctions;
      storeNameToAuctionId[current.storeName][_productId] = _auctionId;
      totalAuctions = totalAuctions + 1;
      createAuction( _startingPrice, _endingPrice,_duration,seller,_auctionId);

      // Let the world know about the new product!
    //  emit LogNewAuctionProduct(_auctionId, current.storeName);
      return(auctionId);
    }

  /// @dev Computes the current price of the item on auction
  function _currentPrice(Auction storage _auction)
      internal
      view
      returns (uint256)
  {
      uint256 secondsPassed = 0;

      // A bit of insurance against negative values (or wraparound).
      // Probably not necessary (since Ethereum guarnatees that the
      // now variable doesn't ever go backwards).
      if (now > _auction.startedAt) {
          secondsPassed = now - _auction.startedAt;
      }

      //call to internal function
      return _computeCurrentPrice(
          _auction.startingPrice,
          _auction.endingPrice,
          _auction.duration,
          secondsPassed
      );
  }

  /// @dev Computes the current price of an auction. Factored out
  ///  from _currentPrice so we can run extensive unit tests.
  ///  When testing, make this function public and turn on
  ///  `Current price computation` test suite.
  function _computeCurrentPrice(
      uint256 _startingPrice,
      uint256 _endingPrice,
      uint256 _duration,
      uint256 _secondsPassed
  )
      //internal // comment out when testing
      pure
      returns (uint256)
  {
      // NOTE: We don't use SafeMath (or similar) in this function because
      //  all of our public functions carefully cap the maximum values for
      //  time (at 64-bits) and currency (at 128-bits). _duration is
      //  also known to be non-zero (see the require() statement in
      //  _addAuction())
      if (_secondsPassed >= _duration) {
          // We've reached the end of the dynamic pricing portion
          // of the auction, just return the end price.
          return _endingPrice;
      } else {
          // Starting price can be higher than ending price (and often is!), so
          // this delta can be negative.
          int256 totalPriceChange = int256(_endingPrice) - int256(_startingPrice);

          // This multiplication can't overflow, _secondsPassed will easily fit within
          // 64-bits, and totalPriceChange will easily fit within 128-bits, their product
          // will always fit within 256-bits.
          int256 currentPriceChange = totalPriceChange * int256(_secondsPassed) / int256(_duration);

          // currentPriceChange can be negative, but if so, will have a magnitude
          // less that _startingPrice. Thus, this result will always end up positive.
          int256 currentPrice = int256(_startingPrice) + currentPriceChange;

          return uint256(currentPrice);
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
        require(_isOnAuction(auction));
        return (auction.duration);
      }
      function getReservePrice(uint auctionId) public constant returns(uint){
        Auction storage auction = auctionIdToAuction[auctionId];
        require(_isOnAuction(auction));
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
