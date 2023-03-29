// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

abstract contract ENS {
    function resolver(bytes32 node) public virtual view returns (Resolver);
}

abstract contract Resolver {
    function addr(bytes32 node) public virtual view returns (address);
}

error WrongLetterTransferFunction();
error ReceiverIsPreviousOwner();
error UnapprovedSender();

contract ENSChainLetter is ERC721 {
    ENS public ens = ENS(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e);
    mapping(bytes32 => bool) public previousLetterOwners;
    uint32 public numLetterTransfers;

    event LetterTransfer(address indexed from, address indexed to, uint32 n, bytes32 indexed ensNode);

    constructor(bytes32 firstOwnerENSNode) ERC721("ENSChainLetter", "ECL") {
        address to = ens.resolver(firstOwnerENSNode).addr(firstOwnerENSNode);
        previousLetterOwners[firstOwnerENSNode] = true;
        _mint(to, 0);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://ens-chain-letter.xyz/nft/";
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        if (tokenId == 0) {
            revert WrongLetterTransferFunction();
        }
        ERC721.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override {
        if (tokenId == 0) {
            revert WrongLetterTransferFunction();
        }
        ERC721.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        if (tokenId == 0) {
            revert WrongLetterTransferFunction();
        }
        ERC721.safeTransferFrom(from, to, tokenId, data);
    }

    function transferLetter(address from, bytes32 ensNode, bytes memory data) public {
        if (previousLetterOwners[ensNode]) {
            revert ReceiverIsPreviousOwner();
        }
        if (!_isApprovedOrOwner(_msgSender(), 0)) {
            revert UnapprovedSender();
        }

        address to = ens.resolver(ensNode).addr(ensNode);
        _safeTransfer(from, to, 0, data);
        previousLetterOwners[ensNode] = true;
        numLetterTransfers++;

        emit LetterTransfer(from, to, numLetterTransfers - 1, ensNode);
        _mint(from, numLetterTransfers);
    }

    function totalSupply() external view returns (uint256) {
        return numLetterTransfers + 1;
    }

    function tokenByIndex(uint256 index) external pure returns (uint256) {
        return index;
    }
}
