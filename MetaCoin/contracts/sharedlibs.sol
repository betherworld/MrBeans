pragma solidity >=0.4.0 <0.6.0;

library SharedStructs {
     
   // address public constant peterson = 0x9A3BF8a0d197F3bEED1DA33b5FaAcef842Db4Df0;
    
    /*function getPeterson() public returns (address) {
        return peterson;
    }
    
    function getWC_ADDR() public returns (address) {
        return WC_ADDR;
    }
    
    function getHC_ADDR() public returns (address) {
        return HC_ADDR;
    }*/
    
    struct Position {
        uint longitude;
        uint latitude;
    }  
    
    // time is a UTC timestamp
    struct HarvestData {
        Position position;
        string time; 
        uint volume;
        bool bio;    
    }
    
    struct Account {
        uint id;
        address addr;
    }
    
    struct Field {
        uint id;
        Position northEast;
        Position southWest;
    }
    
    struct CropData {
        uint fieldID;
        //uint warehouseID;
        string harvestTime;
        string packageTime;
        bool bio;
    }
}