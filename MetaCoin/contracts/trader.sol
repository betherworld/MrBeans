pragma solidity >=0.4.0 <0.6.0;
import  "./warehouse.sol";
import {SharedStructs as lib} from "./sharedlibs.sol";
pragma experimental ABIEncoderV2;

contract TraderContract {

    address petersonEOA;
    modifier onlyPeterson() {
        require(msg.sender==petersonEOA);
        _;
    }

    lib.Account[] traders;

    modifier onlyTrader() {
        bool isTrader = false;
        for(uint i = 0; i<traders.length; i++) {
            if (msg.sender == traders[i].addr)
                isTrader = true;
        }
        require(isTrader==true);

        _;
    }

    WarehouseContract wc;
    constructor(address WC_ADDR, address peterson) public {
        wc = WarehouseContract(WC_ADDR);
        petersonEOA = peterson;
    }

    /**************************************  E V E N T S  *******************************************/

    event invalidTruck();
    event unidentifiedBags();

    /************************************** R E G I S T E R ***********************************/

    function registerTrader(lib.Account memory trader) public payable onlyPeterson {
        traders.push(trader);
    }

    function deRegisterTrader(uint traderID) public payable onlyPeterson {
        for (uint i = 0; i<traders.length; i++)
        {
            if (traders[i].id == traderID) {
                delete traders[i];
            }
        }
    }

    /****************************** E N T R Y    P O I N T **************************************/

    // if a truck is detected which is not registered the camera triggers this function
    function reportInvalidTruck() public payable onlyTrader {
        emit invalidTruck();
    }

    // argument "RFIDs" are bags on truck
    function verifyTruck(uint truckID, uint[] memory RFIDs) public payable onlyTrader {
        uint[] memory bags = wc.getTruckBags(truckID);
        uint count = 0;
        for (uint i = 0; i<RFIDs.length; i++){
            for (uint j = 0; j<bags.length; j++){
                if (RFIDs[i] == bags[j]){
                    count++;
                    break;
                }
            }
        }
        if (bags.length != count) {
            emit unidentifiedBags();
        }
    }

    /****************************** P R O C E S S I N G **************************************/

    // use warehouse functions

    /****************************** E X I T    P O I N T **************************************/

}
