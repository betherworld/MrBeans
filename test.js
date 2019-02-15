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

// Peterson registers two trucks to the blockchain
let truckAddr = accounts[1]
let truckID_1 = 2365
let truckID_2 = 8553
hc.registerTruck({id: truckID_1, addr: truckAddr}, {from: peterson})
hc.registerTruck({id: truckID_2, addr: truckAddr}, {from: peterson})

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

// simulate a harvesting machine done loading a truck, and store data of harvested batch.
// Also simulate truck loaded in a different field (proof is in GPS position out of registered field bounds)
// and store its batch.
let harvestData = {position: {longitude: 8, latitude: 8}, time: "11:23", volume:10000, bio: 1}
let fakeHarvestData = {position: {longitude: 25, latitude: 34}, time: "11:26", volume:10000, bio: 1}
hc.storeHarvestData(harvestData, truckID_1, {from: truckAddr})
hc.storeHarvestData(fakeHarvestData, truckID_2, {from: truckAddr})

// when a truck (with raw product) arrives at (any, could be trader's) warehouse
// it is identified and we check if it has loaded product coming from a correct field
// e.g. only from bio fields. Second check returns a violation and triggers the event "invalidTruck"
// as can be seen from the response
wc.verifyTruck(warehouseID, truckID_1, {from: warehouseAddr})
wc.verifyTruck(warehouseID, truckID_2, {from: warehouseAddr})

// if an unidentified truck (source of counterfeit soybeans) approaches the warehouses
// it notifies such violation on the blockchain, and emits an "invalidTruck" event
// wc.reportInvalidTruck({from: warehouseAddr}) ************************************************************************************

// after unloading of soybean batch from verified truck in warehouse
// we make an additional control on the amount of the unloaded batch,
// which has to prove less than the amount loaded on field
let entryVolume_1 = 9980;
wc.verifyVolume(entryVolume_1, truckID_1, {from: warehouseAddr})

// we load another truck and send it to the warehouse to show
// that if he has loaded other soybeans from unregistered sources,
// i.e. entry volume exceeds loaded volume, an "invalidVolume" event is triggered
fakeHarvestData.position = {longitude: 10, latitude: 9}
fakeHarvestData.time = "11:50"
hc.storeHarvestData(fakeHarvestData, truckID_1, {from: truckAddr})
wc.verifyTruck(warehouseID, truckID_1, {from: warehouseAddr})
let entryVolume_2 = 11000;
wc.verifyVolume(entryVolume_2, truckID_1, {from: warehouseAddr})

// inside the warehouse an automatic process assigns RFIDs to each bag
// linking them to product specifics, and immediately registers assigned RFIDs on the blockchain
let RFIDs = [3423, 1213, 2442, 5567, 4654, 2143]
let cropData = {fieldID: fieldID , harvestTime: harvestData.time , packageTime:"18:00", bio: harvestData.bio}
wc.assignRFID(warehouseID, RFIDs[0], cropData, {from: warehouseAddr})
wc.assignRFID(warehouseID, RFIDs[1], cropData, {from: warehouseAddr})
wc.assignRFID(warehouseID, RFIDs[2], cropData, {from: warehouseAddr})
wc.assignRFID(warehouseID, RFIDs[3], cropData, {from: warehouseAddr})
wc.assignRFID(warehouseID, RFIDs[4], cropData, {from: warehouseAddr})
wc.assignRFID(warehouseID, RFIDs[5], cropData, {from: warehouseAddr})

// at exit point of warehouse bags are loaded on some truck.
// Loaded bags are assigned to a truck on blockchain as well.
let loadedBags_1 = [3423, 1213, 5567]
wc.loadBagsOnTruck(warehouseID, truckID_1, loadedBags_1, {from: warehouseAddr})

// loaded bags must come from inside the warehouse (not be mixed with an external source),
// thus we internally compare loaded bag RFIDs with stamped RFIDs and if some bag is not
// registered we raise an "unidentifiedBags" event
let fakeLoadedBags = [2442, 4654, 4334]
wc.loadBagsOnTruck(warehouseID, truckID_2, fakeLoadedBags, {from: warehouseAddr})

// when a truck (with bags) arrives at trader (to go respectively to dispatch
// or to the trader's warehouse), it is identified and we check if he has loaded
// product coming from right field
let receivedBags = [3423, 1213, 5567]
tc.verifyTruck(truckID_1, receivedBags, {from: traderAddr})

// now we load a second truck correctly and send it to the warehouse where a new bag is found
// either with no RFID or with an unregistered RFID (i.e. counterfeited). With this trial
// we show that a "unidentifiedBags" event is raised. Furthermore if some bags went missing
// during transport a "lostBags" event would be raised.
let loadedBags_2 = [2143, 1213, 5567]
wc.loadBagsOnTruck(warehouseID, truckID_1, loadedBags_2, {from: warehouseAddr})
let receivedBags_2 = [2143, 1213, 5567, 0303]
tc.verifyTruck(truckID_1, receivedBags_2, {from: traderAddr})
