pragma solidity ^0.4.24;

/**
  * @dev Base contract which controls accessibility for both the Maats Network
  * of stores and the stores themselves. This contract also implements an
  * emergency stop using pausible functions and methods to restrain access to
  * dangerous functions in the case of a malicious event. The puasable nature
  * of the contract is also important for implementing upgradeability.
  */

contract StoreAccessControl{

  // Define the network owner
  address public maatsOwner;

  event LogNewOwner(address indexed previousOwner,address indexed newOwner);
  event LogNewAdmin(address indexed newAdmin);
  event LogAdminRevoked(address indexed revokedAdmin);

  /// @dev There are at most 5 admins managing the Maats Network
  address[5] public maatsAdmins;

  /// @dev Determine if an address is a network admin
  mapping (address => bool) isMaatsAdmin;

  /// @dev Limit function access to the owner of the Maats Network
  modifier onlyMaatsOwner() {
    require(msg.sender == maatsOwner);
    _;
  }

  /// @dev Limit function access to only admins, owner NOT inclueded
  modifier onlyMaatsAdmin(){
    require(isMaatsAdmin[msg.sender] == true);
    _;
  }

  /// @dev Access provided to both the owner and the admins of the network
  modifier onlyMaatsLeadership(){
    require(
      msg.sender == maatsOwner ||
      isMaatsAdmin[msg.sender] == true
      );
    _;
  }

  /// @dev Constructor simply sets the owner of Maats Network
  constructor() public {
    maatsOwner = msg.sender;
  }

  /// @dev allow the current owner to transfer their ownership
  /// @param _newOwner the address which will then have ownership over Maats
  function setMaatsOwner(address _newOwner) public onlyMaatsOwner whenNotPaused{
    require(_newOwner != address(0));
    address oldOwner = maatsOwner;
    maatsOwner = _newOwner;

    // Let everyone know who transfered their ownership to whom.
    emit LogNewOwner(_newOwner, oldOwner);
  }

  /// @dev Only the owner can create a new network admin. Require's that the
  /// address isn't already an admin and that it isn't equal to 0.
  /// @param _newAdmin The address being added as an admin
  function createMaatsAdmin(address _newAdmin) public onlyMaatsOwner whenNotPaused{
    require(_newAdmin != address(0));

    for(uint i; i<=4; ++i){
      if (maatsAdmins[i] == _newAdmin){require(1 == 2);}
    }

    // Ensure there is space for the new admin
    bool space = false;
    for (uint j; j <=4 && space == false; j++){
      if(maatsAdmins[j] == 0){
        maatsAdmins[j] = _newAdmin;
        isMaatsAdmin[_newAdmin] =true;
        space = true;
        emit LogNewAdmin(_newAdmin);
      }
    }
    // Throw if there were already 5 maatsAdmins to avoid silent failure
    assert(space == true);
  }

  /// @dev The owner can remove an admin for any reason. The function iterates
  /// through the array until the address is found and removed. The array
  /// doesn't need to be restructured because the order of admins is insignificant
  /// @param _revokedAdmin The address being removed as an admin
  function removeMaatsAdmin(address _revokedAdmin) public onlyMaatsOwner whenNotPaused{
    bool removed = false;
    for (uint i= 0; i <=4 && removed == false; i++){
      if(maatsAdmins[i] == _revokedAdmin){
        maatsAdmins[i] = 0;
        isMaatsAdmin[_revokedAdmin] = false;
        removed = true;
        emit LogAdminRevoked(_revokedAdmin);
      }
    }
    // Throws if the address isn't in the admins array to avoid silent failure
    assert(removed == true);
  }

  /// @dev Pull withdraw from contract. There isn't a payment method but doneations
  /// are accepted. Only the owner can withdraw the funds.
  function withdraw() external onlyMaatsOwner{
    maatsOwner.transfer(address(this).balance);
  }

  /// @dev Modified version of OpenZeppelin's Pausable to match Maat's accessibility
  /// Pausable is used as to enable emergency stops as well as safe upgrading of contracts
  event Pause();
  event Unpause();

  /// @dev pause will be set to true in Core constructor. The owner must
  /// unpause the contracts after deployment to ensure proper connection with
  /// the proxy contract and the escrow contracts to which the contract linked.
  bool public pause;

  /// @dev Controls functions to ensure they can't be accessed if the owner
  /// pauses the contract.
  modifier whenNotPaused(){
    require(pause == false);
    _;
  }

  /// @dev Certain functions should only be accessible when the contract is paused
  modifier whenPaused(){
    require(pause == true);
    _;
  }

  /// @dev Only the owner can pause the contract when it isn't already paused
  function _pause() onlyMaatsOwner whenNotPaused public{
    pause = true;
    emit Pause();
  }
  
  /// @dev Only the owner can unpause the contract when its currently paused.
  function _unpause() onlyMaatsOwner whenPaused public{
    pause = false;
    emit Unpause();
  }


}
