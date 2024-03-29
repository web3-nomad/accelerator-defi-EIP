import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { deploySuiteWithModularCompliancesFixture } from '../fixtures/deploy-full-suite.fixture';

async function deployTransferRestrictFullSuite() {
  const context = await loadFixture(deploySuiteWithModularCompliancesFixture);
  const complianceModule = await ethers.deployContract('TransferRestrictModule');
  await context.suite.compliance.bindToken(await context.suite.token.getAddress());
  await context.suite.compliance.addModule(await complianceModule.getAddress());

  return {
    ...context,
    suite: {
      ...context.suite,
      complianceModule,
    },
  };
}

describe('Compliance Module: TransferRestrict', () => {
  it('should deploy the TransferRestrict contract and bind it to the compliance', async () => {
    const context = await loadFixture(deployTransferRestrictFullSuite);

    expect(await context.suite.complianceModule.getAddress()).not.to.be.undefined;
    expect(await context.suite.compliance.isModuleBound(await context.suite.complianceModule.getAddress())).to.be.true;
  });

  describe('.name', () => {
    it('should return the name of the module', async () => {
      const context = await loadFixture(deployTransferRestrictFullSuite);

      expect(await context.suite.complianceModule.name()).to.be.equal('TransferRestrictModule');
    });
  });

  describe('.isPlugAndPlay', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployTransferRestrictFullSuite);
      expect(await context.suite.complianceModule.isPlugAndPlay()).to.be.true;
    });
  });

  describe('.canComplianceBind', () => {
    it('should return true', async () => {
      const context = await loadFixture(deployTransferRestrictFullSuite);
      const complianceModule = await ethers.deployContract('TransferRestrictModule');
      expect(await complianceModule.canComplianceBind(await context.suite.compliance.getAddress())).to.be.true;
    });
  });

  describe('.allowUser', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.allowUser(context.accounts.aliceWallet.address)).to.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling via compliance', () => {
      it('should allow user', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        const tx = await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function allowUser(address _userAddress)']).encodeFunctionData('allowUser', [
            context.accounts.aliceWallet.address,
          ]),
          await context.suite.complianceModule.getAddress(),
        );

        await expect(tx)
          .to.emit(context.suite.complianceModule, 'UserAllowed')
          .withArgs(await context.suite.compliance.getAddress(), context.accounts.aliceWallet.address);
      });
    });
  });

  describe('.batchAllowUsers', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.batchAllowUsers([context.accounts.aliceWallet.address])).to.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling via compliance', () => {
      it('should allow identities', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        const tx = await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function batchAllowUsers(address[] _identities)']).encodeFunctionData('batchAllowUsers', [
            [context.accounts.aliceWallet.address, context.accounts.bobWallet.address],
          ]),
          await context.suite.complianceModule.getAddress(),
        );

        await expect(tx)
          .to.emit(context.suite.complianceModule, 'UserAllowed')
          .withArgs(await context.suite.compliance.getAddress(), context.accounts.aliceWallet.address)
          .to.emit(context.suite.complianceModule, 'UserAllowed')
          .withArgs(await context.suite.compliance.getAddress(), context.accounts.bobWallet.address);
      });
    });
  });

  describe('.disallowUser', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.disallowUser(context.accounts.aliceWallet.address)).to.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling via compliance', () => {
      it('should disallow user', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function allowUser(address _userAddress)']).encodeFunctionData('allowUser', [
            context.accounts.aliceWallet.address,
          ]),
          await context.suite.complianceModule.getAddress(),
        );

        const tx = await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function disallowUser(address _userAddress)']).encodeFunctionData('disallowUser', [
            context.accounts.aliceWallet.address,
          ]),
          await context.suite.complianceModule.getAddress(),
        );

        await expect(tx)
          .to.emit(context.suite.complianceModule, 'UserDisallowed')
          .withArgs(await context.suite.compliance.getAddress(), context.accounts.aliceWallet.address);
      });
    });
  });

  describe('.batchDisallowUsers', () => {
    describe('when calling directly', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.batchDisallowUsers([context.accounts.aliceWallet.address])).to.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling via compliance', () => {
      it('should disallow user', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function batchAllowUsers(address[] _identities)']).encodeFunctionData('batchAllowUsers', [
            [context.accounts.aliceWallet.address, context.accounts.bobWallet.address],
          ]),
          await context.suite.complianceModule.getAddress(),
        );

        const tx = await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function batchDisallowUsers(address[] _identities)']).encodeFunctionData('batchDisallowUsers', [
            [context.accounts.aliceWallet.address, context.accounts.bobWallet.address],
          ]),
          await context.suite.complianceModule.getAddress(),
        );

        await expect(tx)
          .to.emit(context.suite.complianceModule, 'UserDisallowed')
          .withArgs(await context.suite.compliance.getAddress(), context.accounts.aliceWallet.address)
          .to.emit(context.suite.complianceModule, 'UserDisallowed')
          .withArgs(await context.suite.compliance.getAddress(), context.accounts.bobWallet.address);
      });
    });
  });

  describe('.isUserAllowed', () => {
    describe('when user is allowed', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function allowUser(address _userAddress)']).encodeFunctionData('allowUser', [
            context.accounts.aliceWallet.address,
          ]),
          await context.suite.complianceModule.getAddress(),
        );

        const result = await context.suite.complianceModule.isUserAllowed(await context.suite.compliance.getAddress(), context.accounts.aliceWallet.address);
        expect(result).to.be.true;
      });
    });

    describe('when user is not allowed', () => {
      it('should return false', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        const result = await context.suite.complianceModule.isUserAllowed(await context.suite.compliance.getAddress(), context.accounts.aliceWallet.address);
        expect(result).to.be.false;
      });
    });
  });

  describe('.moduleCheck', () => {
    describe('when sender and receiver are not allowed', () => {
      it('should return false', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        const to = context.accounts.anotherWallet.address;
        const from = context.accounts.aliceWallet.address;
        const result = await context.suite.complianceModule.moduleCheck(from, to, 10, await context.suite.compliance.getAddress());
        expect(result).to.be.false;
      });
    });

    describe('when sender is allowed', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        const to = context.accounts.aliceWallet.address;
        const from = context.accounts.bobWallet.address;

        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function allowUser(address _userAddress)']).encodeFunctionData('allowUser', [from]),
          await context.suite.complianceModule.getAddress(),
        );

        const result = await context.suite.complianceModule.moduleCheck(from, to, 10, await context.suite.compliance.getAddress());
        expect(result).to.be.true;
      });
    });

    describe('when receiver is allowed', () => {
      it('should return true', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);
        const to = context.accounts.aliceWallet.address;
        const from = context.accounts.bobWallet.address;

        await context.suite.compliance.callModuleFunction(
          new ethers.Interface(['function allowUser(address _userAddress)']).encodeFunctionData('allowUser', [to]),
          await context.suite.complianceModule.getAddress(),
        );

        const result = await context.suite.complianceModule.moduleCheck(from, to, 10, await context.suite.compliance.getAddress());
        expect(result).to.be.true;
      });
    });
  });

  describe('.moduleMintAction', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.moduleMintAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(
          context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function moduleMintAction(address, uint256)']).encodeFunctionData('moduleMintAction', [
              context.accounts.anotherWallet.address,
              10,
            ]),
            await context.suite.complianceModule.getAddress(),
          ),
        ).to.eventually.be.fulfilled;
      });
    });
  });

  describe('.moduleBurnAction', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(context.suite.complianceModule.moduleBurnAction(context.accounts.anotherWallet.address, 10)).to.be.revertedWith(
          'only bound compliance can call',
        );
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(
          context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function moduleBurnAction(address, uint256)']).encodeFunctionData('moduleBurnAction', [
              context.accounts.anotherWallet.address,
              10,
            ]),
            await context.suite.complianceModule.getAddress(),
          ),
        ).to.eventually.be.fulfilled;
      });
    });
  });

  describe('.moduleTransfer', () => {
    describe('when calling from a random wallet', () => {
      it('should revert', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(
          context.suite.complianceModule.moduleTransferAction(context.accounts.aliceWallet.address, context.accounts.anotherWallet.address, 10),
        ).to.be.revertedWith('only bound compliance can call');
      });
    });

    describe('when calling as the compliance', () => {
      it('should do nothing', async () => {
        const context = await loadFixture(deployTransferRestrictFullSuite);

        await expect(
          context.suite.compliance.callModuleFunction(
            new ethers.Interface(['function moduleTransferAction(address _from, address _to, uint256 _value)']).encodeFunctionData(
              'moduleTransferAction',
              [context.accounts.aliceWallet.address, context.accounts.anotherWallet.address, 80],
            ),
            await context.suite.complianceModule.getAddress(),
          ),
        ).to.eventually.be.fulfilled;
      });
    });
  });
});
