/* Install Truffle and Ganache.
Unzip MetaCoin to known folder on pc.
Open Ganache.
Open terminal and move inside MetaCoin directory. Type "truffle compile".
Then type "truffle console". Inside truffle console type following commands
and follow comments to understand console output.
*/

//create references to deployed contracts
let hc = await HarvestContract.deployed()
let wc = await WarehouseContract.deployed()
let tc = await TraderContract.deployed()

//get available accounts on the virtual blockchain (Ganache)
let accounts = await web3.eth.getAccounts()

// simulate Peterson's EOA
let peterson = accounts[0]

// Peterson registers a field to blockchain
let fieldID = 1224
let fieldNE = {longitude: 14, latitude: 14}
let fieldSW = {longitude: 1, latitude: 1}
hc.registerField({id: fieldID, northEast: fieldNE, southWest: fieldSW}, {from: peterson})

// Peterson registers a truck to blockchain
let truckAddr = accounts[1]
let truckID = 2365
hc.registerTruck({id: truckID, addr: truckAddr}, {from: peterson})

// Peterson registers a warehouse to blockchain
let warehouseID = 1112
let warehouseAddr = accounts[2]
wc.registerWarehouse({id: warehouseID, addr: warehouseAddr}, {from: peterson})

// Peterson associates fields to respective warehouses
// e.g. only bio fields to a certain warehouse and v.v.
wc.registerFieldsToWarehouse(warehouseID, [fieldID], {from: peterson})

// Peterson registers trader to blockchain
let traderID = 7584
let traderAddr = accounts[3]
tc.registerTrader({id: traderID, addr: traderAddr}, {from: peterson})

// simulate a harvesting machine done loading a truck, and store data of harvested batch
let harvestData = {position: {longitude: 8, latitude: 8}, time: "11:23", volume:10000, bio: 1}
hc.storeHarvestData(harvestData, truckID, {from: truckAddr})

// when a truck (with raw product) arrives at (any, could be trader's) warehouse
// it is identified and we check if it has loaded product coming from a correct field
// e.g. only from bio fields
wc.verifyTruck(warehouseID, truckID, {from: warehouseAddr})

// after unloading of soybean batch from verified truck in warehouse
// we make an additional control on the amount of the unloaded batch,
// which has to prove less than the amount loaded on field
let entryVolume = 9980;
wc.verifyVolume(entryVolume, truckID, {from: warehouseAddr})

// inside the warehouse an automatic process assigns RFIDs to each bag
// linking them to product specifics, and immediately registers assigned RFIDs on the blockchain
let RFIDs = [3423, 1213, 2442, 5567, 4654]
let cropData = {fieldID: fieldID , harvestTime: harvestData.time , packageTime:"18:00", bio: harvestData.bio}
wc.assignRFID(warehouseID, RFIDs[0], cropData, {from: warehouseAddr})
wc.assignRFID(warehouseID, RFIDs[1], cropData, {from: warehouseAddr})
wc.assignRFID(warehouseID, RFIDs[2], cropData, {from: warehouseAddr})
wc.assignRFID(warehouseID, RFIDs[3], cropData, {from: warehouseAddr})
wc.assignRFID(warehouseID, RFIDs[4], cropData, {from: warehouseAddr})

// at exit point of warehouse bags are loaded on some truck.
// Loaded bags are assigned to a truck on blockchain as well.
let loadedBags = [3423, 1213, 5567]
wc.loadBagsOnTruck(warehouseID, truckID, loadedBags, {from: warehouseAddr})

// when a truck (with bags) arrives at trader (to go respectively to dispatch
// or to the trader's warehouse), it is identified and we check if he has loaded
// product coming from right field
let receivedBags = [3423, 1213, 5567]
tc.verifyTruck(truckID, receivedBags, {from: traderAddr})
