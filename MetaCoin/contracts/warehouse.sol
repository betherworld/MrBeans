pragma solidity >=0.4.0 <0.6.0;
import {HarvestContract} from "./harvest.sol";
import {SharedStructs as lib} from "./sharedlibs.sol";
pragma experimental ABIEncoderV2;

contract WarehouseContract {

    address petersonEOA;
    modifier onlyPeterson() {
        require(msg.sender==petersonEOA);
        _;
    }

    modifier onlyWarehouse() {
        bool isWarehouse = false;
        for(uint i = 0; i<warehouses.length; i++) {
            if (msg.sender == warehouses[i].addr)
                isWarehouse = true;
        }
        require(isWarehouse==true);

        _;
    }

    HarvestContract hc;
    constructor(address HC_ADDR, address peterson) public {
        hc = HarvestContract(HC_ADDR);
        petersonEOA = peterson;
    }

    /**************************************  E V E N T S  *******************************************/

    event invalidTruck();
    event invalidVolume();
    event unidentifiedBags();

    /**************************************  D A T A *******************************************/
    lib.Account[] warehouses;
    mapping(uint => uint[]) fieldWarehouseMap;
    mapping(uint => lib.CropData) RFIDCropMap;
    mapping(uint => uint[]) warehouseRFIDMap;
    mapping(uint => uint[]) truckBagsMap;

    /************************************** R E G I S T E R ***********************************/

    function registerWarehouse(lib.Account memory warehouse) public payable onlyPeterson {
        warehouses.push(warehouse);
    }

    /*function deRegisterWarehouse(uint warehouseID) public payable onlyPeterson {
        for (uint i = 0; i<warehouses.length; i++)
        {
            if (warehouses[i].id == warehouseID) {
                delete warehouses[i];
            }
        }
    }*/

    function registerFieldsToWarehouse(uint warehouseID, uint[] memory fieldIDs) public payable onlyPeterson {
        fieldWarehouseMap[warehouseID] = fieldIDs;
    }

    /*function deRegisterFieldFromWarehouse(uint warehouseID, uint fieldID) public payable onlyPeterson {
        uint[] memory fields =  fieldWarehouseMap[warehouseID];
        for (uint i = 0; i<fields.length; i++)
        {
            if (fields[i] == fieldID) {
                delete fields[i];
            }
        }
    }*/

    /****************************** E N T R Y    P O I N T **************************************/

    // if a truck is detected which is not registered the camera triggers this function
    function reportInvalidTruck() public payable onlyWarehouse() {
        emit invalidTruck();
    }

    // verifies if truck was loaded in a field corresponding to the warehouse
    function verifyTruck(uint warehouseID, uint truckID) public payable onlyWarehouse() {

        lib.HarvestData memory truck = hc.getLoadedTruckData(truckID);
        uint fieldID = hc.positionToField(truck.position);
        uint[] memory warehouseFields = fieldWarehouseMap[warehouseID];
        for (uint i = 0; i<warehouseFields.length; i++) {
            if (fieldID == warehouseFields[i])
                return;
        }
        emit invalidTruck();
    }

    // after soybean unloading in warehouse is completed we verify that volume doesn't
    // exceed original loaded volume
    function verifyVolume(uint unloadedVol, uint truckID) public payable onlyWarehouse() {
        lib.HarvestData memory truck = hc.getLoadedTruckData(truckID);
        if (unloadedVol <= truck.volume) {
            hc.unloadTruck(truckID);
        }
        else
            emit invalidVolume();
    }

    /****************************** P R O C E S S I N G **************************************/

    function assignRFID(uint warehouseID, uint RFID, lib.CropData memory data) public payable onlyWarehouse() {
        RFIDCropMap[RFID] = data;
        warehouseRFIDMap[warehouseID].push(RFID);
    }

    /****************************** E X I T    P O I N T **************************************/

    // only bags which have RFIDs can be loaded on trucks (and then compared by trader)
    function loadBagsOnTruck(uint warehouseID, uint truckID, uint[] memory bagIDs) public payable onlyWarehouse(){
        uint[] memory RFIDs = warehouseRFIDMap[warehouseID];
        uint matches = 0;
        for (uint i = 0; i<bagIDs.length; i++)
        {
            for (uint j = 0; j<RFIDs.length; j++) {
                if (RFIDs[j] == bagIDs[i])
                {
                    matches++;
                    break;
                }
            }
        }
        if (matches == bagIDs.length) {
            truckBagsMap[truckID] = bagIDs;
        }
        else
            emit unidentifiedBags();
    }

    // called by trader to retrieve true loaded bags
    function getTruckBags(uint truckID) public view /*onlyTrader*/ returns (uint[] memory) {
        return truckBagsMap[truckID];
    }

}
