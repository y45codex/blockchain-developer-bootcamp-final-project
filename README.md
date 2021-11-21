# blockchain-developer-bootcamp-final-project

## Decentralized Autonomous Community

### Membership flow
- A user must connect to their MetaMask wallet to be identified.
- They must lock in a certain amount to become a "Member" of the community (membership stake).
- If a Member requests to leave:
  - Their locked stake is released
  - They are no longer recognised as a member and are marked as strangers 
  - Once a stranger, always a stranger (A stranger may not become a member again)

### Proposal flow
- Once the size of the community reach a certain number (founder population), any Member can submit a Proposal for a Principal with a fee (Proposal Fee) 
- Members can support any Proposal with a fee (Support Fee)
- If a Proposal doesn't reach a certain level of support proportional to the size of the community (Bill threshold) in a certain time window (Proposal polling time) it becomes a Failed Proposal.

### Bill flow
- A Proposal becomes a Bill once it reaches a certain level of support proportional to the size of the community (Bill threshold) in a certain time window (Proposal polling time)
- Once a Proposal becomes a Bill, all members can vote on accepting the Bill as a Principal (no fee) in a certain time window (Bill polling time)
- Votes can only be Yay or Nay.
- When voting, Members can also offer a "Reason" for their vote.
- If the number of Yay votes on a Bill reaches two thirds of the population of the members during the fixed "Bill polling time", it is accepted as a "Principal", otherwise it is rejected.






