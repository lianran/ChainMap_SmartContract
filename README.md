## ChainMap_SmartContract

Smart contract for [ChainDev Market Place](https://github.com/chainmaporg/cmp) designed by Infosec Lab., PKU. and ChainMap.


#### Some Functions about Challenge


##### PostChallenge

Post a challenge on the blockchain. [More details](https://github.com/chainmaporg/cmp/wiki/UI-flow#10-user-posts-a-challenge).

* Parameters: challengeId, challengeLevel, challenge, timeEstimation
* Return: null


##### AnswerChallenge

Save an answer on the blockchain.[More details](https://github.com/chainmaporg/cmp/wiki/UI-flow#11-any-user-answer-the-posted-challenge).

* Parameters: challengeId, answerId, answer
* Return: null


##### GetChallenge

Get the information about a challenge from blockchain. 

* Parameters: challengeId
* Return: Challenge Info

##### VoteAnswer 

Vote answer on the blcokchain. [More details](https://github.com/chainmaporg/cmp/wiki/UI-flow#12-community-users-vote-the-answer-of-the-posted-challenge).

* Parameters: challengeId, answerId, result
* Return: null

##### RewardAll

Reward a challenge, its answers and related voter. 

* Parameters: challengeId
* return: null


#### Some Functions about Token

[More details](https://github.com/nebulasio/wiki/blob/master/NRC20.md) about functions.

##### name

Get the name of this project.

* Parameters: null
* return: "ChainMap"


##### name

Get the name of this project.

* Parameters: null
* return: "ChainMap"


##### symbol

Get the symbol of our token.

* Parameters: null
* return: "CMAP"


##### totalSupply

Get the total number of our token.

* Parameters: null
* return: "CMAP"


##### transfer

Transfer token from one account to another.

* Parameters: to, value
* return: null

##### balanceOf

Get the balance of the account.

* Parameters: owner
* return: balance
