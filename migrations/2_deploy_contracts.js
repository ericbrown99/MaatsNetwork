var StoreAccessControl = artifacts.require("./StoreAccessControl.sol");
var StoreBase = artifacts.require("./StoreBase.sol");
var StoreManagement = artifacts.require("./StoreManagement.sol");
var StorePurchasing = artifacts.require("./StorePurchasing.sol");
var StoreAuction = artifacts.require("./StoreAuction.sol");
var StoreCore = artifacts.require("./StoreCore.sol");
var Escrow = artifacts.require("./payment/Escrow.sol");

module.exports = function(deployer) {
  deployer.deploy(Escrow);
  deployer.deploy(StoreAccessControl);
  deployer.deploy(StoreBase);
  deployer.deploy(StoreManagement);
  deployer.link(Escrow,StorePurchasing);
  deployer.deploy(StorePurchasing);
  deployer.deploy(StoreAuction);
  deployer.deploy(StoreCore);
};
