var StoreCore = artifacts.require("./StoreCore.sol");
var Escrow = artifacts.require("./payment/Escrow.sol");

module.exports = function(deployer) {
  deployer.deploy(Escrow);
  deployer.link(Escrow,StoreCore);
  deployer.deploy(StoreCore);
};
