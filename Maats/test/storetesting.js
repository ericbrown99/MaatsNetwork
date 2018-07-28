const StoreCore = artifacts.require("./StoreCore.sol");
const Escrow = artifacts.require("./payment /escrow.sol");

var BigNumber = require('bignumber.js');

contract("StoreCore", function(accounts){
  const maatsOwner = accounts[0];
  const maatsAdmin1 = accounts[1];
  const maatsAdmin2 = accounts[2];
  const store1Owner = accounts[3];
  const store1Admin = accounts[4];
  const store2Owner = accounts[5];
  const store2Admin = accounts[6];
  const customer1 = accounts[7];
  const customer2 = accounts[8];

  // core contract
  let coreC;
  // escrow contract
  let escrowC;

  async function deployContract(){
    coreC = await StoreCore.new();
    // initialize escrow contract to be linked
    escrowC = await Escrow.new();
    // link escrow to maats netowrk
    await coreC.setEscrowAddress(escrowC.address,{
      from: maatsOwner
    });
    // deployer is the original network owner and can set new owner.
    await coreC._unpause({from: maatsOwner});

    await coreC.setMaatsOwner(maatsOwner, {
      from: maatsOwner
    });
  }

  async function deployStore(){
    await coreC.makeStoreOwner(store1Owner,{
      from: maatsOwner
    });
    await coreC.createStore("FirstStore", {
      from: store1Owner
    });
  }

  async function getTransactionGasCost(tx) {
    let transaction = await web3.eth.getTransactionReceipt(tx);
    let amount = await transaction.gasUsed;
    let price = await web3.eth.getTransaction(tx).gasPrice;
    price = price.toNumber();
    return new BigNumber(amount*price);

}

  async function deployProducts(){
    await coreC.createSetPriceProduct(web3.toWei(1,"ether"), 10, {
      from: store1Owner
    });
    await coreC.createSetPriceProduct(web3.toWei(20,"ether"),20,{
      from: store1Owner
    });
  }
  // check initial state of the contract is setup properly
  describe('initial state', function(){
    before(deployContract);

    it('should own contract', async function(){
      const MaatsOwnerAddress = await coreC.maatsOwner();
      assert.equal(MaatsOwnerAddress, maatsOwner);
    });
  });

  describe('admin management', function(){
    before(deployContract);

    it('should create Admin', async function(){
      await coreC.createMaatsAdmin(maatsAdmin1,{
        from: maatsOwner
      });

      const nowAdmin = await coreC.getIsAdmin(maatsAdmin1);
      assert.equal(nowAdmin,true);
    });

    it('shouldnt recognize as admin', async function(){
      const notAdmin = await coreC.getIsAdmin(maatsAdmin2);
      assert.equal(notAdmin,false);
    });

    it('should recognize removed admin', async function(){
      await coreC.removeMaatsAdmin(maatsAdmin1,{
        from: maatsOwner
      });
      const removedAdmin = await coreC.getIsAdmin(maatsAdmin1);
      assert.equal(removedAdmin, false);
    });
  });

  describe('pausing', function(){
    before(deployContract);

    it('should pause when not puased', async function(){
      await coreC._pause({from: maatsOwner});
      const currentState = await coreC.pause();
      assert.equal(currentState, true);
    });

    it('should unpause when paused', async function(){
      await coreC._unpause({from: maatsOwner});
      const currentState = await coreC.pause();
      assert.equal(currentState, false);
    });
  });

  // Tests For StoreBase Below

  describe('Store Owner Management', function(){
    before(deployContract);

    it('Should create a Store Owner', async function(){
      await coreC.makeStoreOwner(store1Owner,{
        from: maatsOwner
      });
      const res = await coreC.isStoreOwner(store1Owner);
      assert.equal(res, true);
    });

    it('Should remove the owner', async function(){
      await coreC.removeStoreOwner(store1Owner, {
        from: maatsOwner
      });
      const res = await coreC.isStoreOwner(store1Owner);
      assert.equal(res, false);
    });

    it('should create store', async function(){
      await coreC.makeStoreOwner(store2Owner,{
        from: maatsOwner
      });
      await coreC.createStore("FirstStore", {
      from: store2Owner
      });
      const res = await coreC.getStoreExists("FirstStore");
      assert.equal(res, true);
    });
  });

  // Tests for StoreManagement Below

  describe('Store Management Tests', function(){
    before(deployContract);
    before(deployStore);

    it('should open the store', async function(){
      await coreC.openStore({from: store1Owner});
      const res = await coreC.isStoreOpen(store1Owner);
      assert.equal(res,true);
    });

    it('should create a store admin', async function(){
      await coreC.createStoreAdmin(store1Admin, {
        from: store1Owner
      });
      const res = await coreC.getIsStoreAdmin(store1Admin);
      assert.equal(res, true);
    });

    it('should remove the admin', async function(){
      await coreC.removeStoreAdmin(store1Admin, {
        from: store1Owner
      });
      const res = await coreC.getIsStoreAdmin(store1Admin);
      assert.equal(res,false);
    });

    it('should create product', async function(){
      await coreC.createSetPriceProduct(100, 5, {
        from: store1Owner
      });
      const res = await coreC.getProductExists(store1Owner);
      assert.equal(res, true);
    });

    it('should add inventory', async function(){
      await coreC.addInventory(0,5, {
        from: store1Owner
      });
      const res = await coreC.getCurrentInventory(store1Owner);
      assert.equal(res,10);
    });

    it('should change the price of the product', async function(){
      await coreC.changePrice(120,0, {
        from: store1Owner
      });
      const res = await coreC.getCurrentPrice(store1Owner);
      assert.equal(res,120);
    });
  });

  // Tests for StorePurchasing below

  describe('Store Purchasing Tests', function(){
    before(deployContract);
    before(deployStore);
    before(deployProducts);

    it('should find first item for sale', async function(){
      const res = await coreC.findFirstItemForSale(0,"FirstStore");
      assert.equal(res, 0);
    });

    it('should let customer buy an item', async function(){
      await coreC.buyItem(0, "FirstStore", {
        value: web3.toWei(1,"ether"),
        from: customer1
      });
      const res = await coreC.getPurchase(customer1);
      assert.equal(res, 0);
    });

    it('should ship the item and withdraw', async function(){
    // test that shipping the item also withdraws funds
      var initialBalance = new BigNumber (web3.eth.getBalance(store1Owner));
      let shipWithdraw = await coreC.shipItem(0,0,{
        from: store1Owner
      });
      var finalBalance = await web3.eth.getBalance(store1Owner);
      var expense = await getTransactionGasCost(shipWithdraw["tx"]);
      var cost = web3.toWei(1,"ether");

      // costs store1Owner eth to call "shipItem";
      var expect = cost - expense;
      // change to balance should be reflected;
      var res = finalBalance - initialBalance;

      // eliminate javascript floating rounding errors for large numbers
      var res = parseFloat(res).toPrecision(7);
      assert.equal(res,expect);
      });

    it('Check that the item is marked as shipped', async function(){
      const res2 = await coreC.getItemShipped(store1Owner,0,0);
      assert.equal(res2,true);
    });
  });

  // Tests below are for StoreAuction.sol

  describe('Tests for StoreAuction', function(){
    before(deployContract);
    before(deployStore);

    it('Should createAuctionProduct', async function(){
      await coreC.createAuctionProduct(1,0,600,{
        from: store1Owner
      });
      const res = await coreC.getAuctionExists(0);
      assert.equal(res,true);
    });

    it('Should correctly compute price', async function(){
      const res = await coreC._computeCurrentPrice(100,0,60,30);
      assert.equal(res, 50);
    });

    it('Should let a customer bid on the auction', async function(){
      await coreC._bid(0,0,{
        from: customer2,
        value: web3.toWei(1, "ether")
      });
      const res = await coreC.didBid(store1Owner, 0, 0);
      assert.equal(res,true);
    });

    it('owner should get funds when shipped', async function(){
      var initialBalance = new BigNumber (web3.eth.getBalance(store1Owner));
      let shipWithdraw = await coreC.shipItem(0,0,{
        from: store1Owner
      });
      var finalBalance = await web3.eth.getBalance(store1Owner);
      var expense = await getTransactionGasCost(shipWithdraw["tx"]);
      var cost = web3.toWei(1,"ether");
      // costs store1Owner eth to call "shipItem";
      var expect = cost - expense;
      // change to balance should be reflected;
      var res = finalBalance - initialBalance;

      // eliminate javascript floating rounding errors for large numbers
      var res = parseFloat(res).toPrecision(7);
      assert.equal(res,expect);
    });

    it('confirm that auction product was shipped', async function(){
      const res = await coreC.getItemShipped(store1Owner,0,0);
      assert.equal(res,true);

    });
  });

});
