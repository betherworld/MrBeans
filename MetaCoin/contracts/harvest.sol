pragma solidity >=0.4.0 <0.6.0;
import {SharedStructs as lib} from "./sharedlibs.sol";
pragma experimental ABIEncoderV2;

contract HarvestContract {

    address public petersonEOA;
    constructor(address peterson) public {
        petersonEOA = peterson;
    }

    modifier onlyPeterson() {
        require(msg.sender==petersonEOA);
        _;
    }

    mapping(uint => lib.HarvestData) loadedTrucks;
    lib.Field[] fields;
    // every truck registered by Peterson
    lib.Account[] trucks;
    uint INVALID_FIELD_ID = 0;

    modifier onlyTruck() {
        bool isTruck = false;
        for(uint i = 0; i<trucks.length; i++) {
            if (msg.sender == trucks[i].addr)
                isTruck = true;
        }
        require(isTruck==true);

        _;
    }

    // only farmers should be given permission to add fields to blockchain
    // Field extreme positions coordinates must be converted by a scale factor of 111000
    function registerField(lib.Field memory field) public payable onlyPeterson  {
        fields.push(field);
    }

    function registerTruck(lib.Account memory truck) public payable onlyPeterson {
        trucks.push(truck);
    }

    /*function deRegisterTruck(uint truckID) public payable onlyPeterson {
        for (uint i = 0; i<trucks.length; i++)
        {
            if (trucks[i].id == truckID) {
                delete trucks[i];
            }
        }
    }*/

    // When truck is done loading harvest on the field must upload crop/truck data on blockchain.
    // Truck position coordinates must be converted by a scale factor of 111000
    // id must match address of truck, as in trucks[] array (truck program assumed safe)
    function storeHarvestData(lib.HarvestData memory data, uint id) public payable onlyTruck {
        loadedTrucks[id] = data;
    }

    function getLoadedTruckData(uint truckID) public view returns (lib.HarvestData memory) {
        return loadedTrucks[truckID];
    }

    function unloadTruck(uint truckID) public payable  {
        loadedTrucks[truckID] = lib.HarvestData(lib.Position(0, 0), "", 0, false);
    }

    // returns INVALID_FIELD_ID if position is not included in any registered field
    function positionToField(lib.Position memory pos) public view returns (uint fieldID) {
        for (uint i = 0; i<fields.length; i++) {
            // condition is met at least in Ucraine
            bool longitudeSatisfied = pos.longitude<fields[i].northEast.longitude &&
                                      pos.longitude>fields[i].southWest.longitude;
            bool latitudeSatisfied = pos.latitude<fields[i].northEast.latitude &&
                                      pos.latitude>fields[i].southWest.latitude;
            if (longitudeSatisfied && latitudeSatisfied) {
                return fields[i].id;
            }
        }
        return INVALID_FIELD_ID;
    }
}
