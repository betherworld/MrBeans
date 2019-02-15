var library = artifacts.require ("SharedStructs");
var hc= artifacts.require("HarvestContract");
var wc= artifacts.require("WarehouseContract");
var tc = artifacts.require("TraderContract");

module.exports= function(deployer) {
  deployer.deploy(library);
  deployer.link(library, [hc, wc, tc]);
  deployer.deploy(hc);
}
