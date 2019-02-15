var library = artifacts.require ("SharedStructs");
var hc= artifacts.require("HarvestContract");
var wc= artifacts.require("WarehouseContract");
var tc = artifacts.require("TraderContract");

module.exports= function(deployer) {
  deployer.deploy(library);
  deployer.link(library, [hc, wc, tc]);
  deployer.deploy(hc, "0x56e33DfDFA4A88ea378F2a9f00Ee7df945153B4d").then(function(){  //added brackets to address
    return deployer.deploy(wc, hc.address, "0x56e33DfDFA4A88ea378F2a9f00Ee7df945153B4d");
  }).then(function(){
    return deployer.deploy(tc, wc.address, "0x56e33DfDFA4A88ea378F2a9f00Ee7df945153B4d");
  });
}
