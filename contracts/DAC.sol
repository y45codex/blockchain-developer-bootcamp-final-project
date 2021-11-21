// SPDX-License-Identifier: MIT
pragma solidity = 0.8.10;

contract DAC {

  enum ProposalStatus {Proposed, Failed, Accepted}
  struct Proposal {
    uint id;
    string body;
    address sponsor;
    uint creation_time;
    ProposalStatus status;
  }

  enum BillStatus {Polling, Rejected, Accepted}
  struct Bill {
    uint id;
    uint proposal_id;
    string body;
    address sponsor;
    uint creation_time;
    BillStatus status;
  }
  struct Vote {
    bool submitted;
    bool yay;
    string reason;
  }

  struct Principal {
    uint id;
    uint bill_id;
    string body;
    address sponsor;
    uint creation_time;
  }

  address public owner = msg.sender;

  uint public population = 0;

  uint private min_founder_count = 1;

  uint private proposal_count = 0;

  uint private membership_stake = 0;

  uint private proposal_fee = 0;

  uint private support_fee = 0;

  uint private bill_threshold_nominator = 1;

  uint private bill_threshold_denominator = 2;

  uint private principal_threshold_nominator = 2;

  uint private principal_threshold_denominator = 3;

  uint private proposal_polling_time = 86400; // 24 hours * 60 minutes * 60 seconds

  uint private bill_polling_time = 86400; // 24 hours * 60 minutes * 60 seconds

  uint private bill_count = 0;

  uint private principal_count = 0;


  mapping(address => uint) private members;
  mapping(uint => Proposal) private proposals;
  mapping(address => mapping(uint => bool)) private supported_by;
  mapping(uint => uint) private support_counts;

  mapping(uint => Bill) private bills;
  mapping(address => mapping(uint => Vote)) private voted_by;
  mapping(uint => uint) private yay_vote_counts;
  mapping(uint => uint) private nay_vote_counts;

  mapping(uint => Principal) private principals;

  modifier onlyMember() {
    require (members[msg.sender] == 1, "Must be a community member");
    _;
  }

  constructor(
    uint _min_founder_count, 
    uint _membership_stake, 
    uint _proposal_fee, 
    uint _support_fee, 
    uint _proposal_polling_time,
    uint _bill_polling_time) {
      min_founder_count     = _min_founder_count;
      membership_stake      = _membership_stake;
      proposal_fee          = _proposal_fee;
      support_fee           = _support_fee;
      proposal_polling_time = _proposal_polling_time;
      bill_polling_time     = _bill_polling_time;
  }

  function register() public payable {
    require (
      membership_stake == msg.value,
      "Wrong stake amount provided" 
    );

    require (
      isStranger(msg.sender) == false,
      "Strangers can't join the community"
    );

    population += 1;
    members[msg.sender] = 1;
  }

  function leave() public payable {
    members[msg.sender] = 2;
    population -= 1;
    payable(msg.sender).transfer(membership_stake);
  }

  function propose(string memory _body) public payable onlyMember returns (bool) {
    require(
      population >= min_founder_count,
      "Community population is not yet big enough"
    );

    require (
      proposal_fee == msg.value,
      "Wrong Proposal fee provided." 
    );

    proposals[proposal_count] = Proposal({
      id           : proposal_count,
      body         : _body,
      sponsor      : msg.sender,
      creation_time: block.timestamp,
      status       : ProposalStatus.Proposed
    });

    proposal_count +=1;

    return true;
  }

  function support(uint _proposal_id) public payable onlyMember returns (bool) {
    require(
      proposals[_proposal_id].status == ProposalStatus.Proposed,
      "Proposal is no more accepting support"
    );

    require (
      support_fee == msg.value,
      "Wrong Support fee provided" 
    );

    require(
      supported_by[msg.sender][_proposal_id] != true,
      "You've already supported this proposal"
    );

    if (block.timestamp - proposal_polling_time > proposals[_proposal_id].creation_time) {
      if (proposals[_proposal_id].status == ProposalStatus.Proposed) {
        proposals[_proposal_id].status = ProposalStatus.Failed;
      }
      revert("Polling time is over");
    }

    supported_by[msg.sender][_proposal_id] = true;
    support_counts[_proposal_id] += 1;

    if ((bill_threshold_denominator * support_counts[_proposal_id]) >= (population * bill_threshold_nominator)) {
      proposals[_proposal_id].status = ProposalStatus.Accepted;

      bills[bill_count] = Bill({
        id           : bill_count,
        proposal_id  : proposals[_proposal_id].id,
        body         : proposals[_proposal_id].body,
        sponsor      : proposals[_proposal_id].sponsor,
        creation_time: block.timestamp,
        status       : BillStatus.Polling
      });

      bill_count +=1;
    }

    return true;
  }

  function vote(uint _bill_id, bool _yay, string memory _reason) public payable onlyMember returns (bool) {
    require(
      bills[_bill_id].status == BillStatus.Polling,
      "Bill is no more accepting vote"
    );

    require(
      voted_by[msg.sender][_bill_id].submitted == false,
      "You've already voted for this bill"
    );

    if (block.timestamp - bill_polling_time > bills[_bill_id].creation_time) {
      if (bills[_bill_id].status == BillStatus.Polling) {
        bills[_bill_id].status = BillStatus.Rejected;
      }
      revert("Polling time is over");
    }

    voted_by[msg.sender][_bill_id] = Vote({
      yay: _yay,
      submitted: true,
      reason: _reason
    });

    if (_yay) {
      yay_vote_counts[_bill_id] += 1;
    } else {
      nay_vote_counts[_bill_id] += 1;
    }
    
    // If nays pass the threshold
    if ((principal_threshold_denominator * nay_vote_counts[_bill_id]) > (population * (principal_threshold_denominator - principal_threshold_nominator))) {
      bills[_bill_id].status = BillStatus.Rejected;
    }

    // If yays pass the threshold
    if ((principal_threshold_denominator * yay_vote_counts[_bill_id]) >= (population * principal_threshold_nominator)) {
      bills[_bill_id].status = BillStatus.Accepted;

      principals[principal_count] = Principal({
        id           : principal_count,
        bill_id      : _bill_id,
        body         : bills[_bill_id].body,
        sponsor      : bills[_bill_id].sponsor,
        creation_time: block.timestamp
      });

      principal_count +=1;
    }

    return true;
  }

  function isMember(address _member) public view returns (bool) {
    return members[_member] == 1;
  }

  function isStranger(address _member) public view returns (bool) {
    return members[_member] == 2;
  }

  function fetchProposal(uint _id) public view 
    returns (uint id, string memory body, address sponsor, uint s_count, ProposalStatus status) {

      id = proposals[_id].id;
      body = proposals[_id].body;
      sponsor = proposals[_id].sponsor;
      s_count = support_counts[id];
      status = proposals[_id].status;

      return (id, body, sponsor, s_count, status);
  }

  function isSupported(uint _proposal_id) public view returns (bool) {
    return supported_by[msg.sender][_proposal_id];
  }

  function fetchBill(uint _id) public view 
    returns (uint id, uint proposal_id, string memory body, address sponsor, uint y_count, uint n_count, BillStatus status) {

      id = bills[_id].id;
      body = bills[_id].body;
      sponsor = bills[_id].sponsor;
      y_count = yay_vote_counts[id];
      n_count = nay_vote_counts[id];
      status = bills[_id].status;
      proposal_id = bills[_id].proposal_id;

      return (id, proposal_id, body, sponsor, y_count, n_count, status);
  }

  function isVoted(uint _bill_id) public view returns (bool submitted, bool yay, string memory reason) {
    return (voted_by[msg.sender][_bill_id].submitted, voted_by[msg.sender][_bill_id].yay, voted_by[msg.sender][_bill_id].reason);
  }

  function fetchPrincipal(uint _id) public view 
    returns (uint id, uint bill_id, string memory body, address sponsor) {

      id = principals[_id].id;
      body = principals[_id].body;
      sponsor = principals[_id].sponsor;
      bill_id = principals[_id].bill_id;

      return (id, bill_id, body, sponsor);
  }
}
