import { FindOptions, ObjectId } from 'mongodb';
import Chance from 'chance';

import { Logger } from '../../../src/config/logger/logger';
import CustomerRepository, {
  CustomerFilterType,
  CustomerUpdate,
} from '../../../src/application/repository/customer-repository';
import { CustomerModel } from '../../../src/application/repository/model/customer-model';
import { AddressModel } from '../../../src/application/repository/model/address-model';
import { UniqueEntityIdVO } from '../../../src/shared/value-object/unique-entity-id.vo';

import { Search } from '../../../src/application/search/search-usecase';
import { Customer } from '../../../src/domain/customer-entity';

const chance = Chance();

const makeRepository = () => {
  class CustomerRepositoryStub implements CustomerRepository {
    add(customer: Customer): Promise<void> {
      throw new Error('Method not implemented.');
    }
    remove(customerId: ObjectId): Promise<number> {
      throw new Error('Method not implemented.');
    }
    findOneAndUpdate(
      filter: CustomerFilterType,
      data: CustomerUpdate
    ): Promise<number> {
      throw new Error('Method not implemented.');
    }
    findOne(
      filter: CustomerFilterType,
      options?: FindOptions<Document> | undefined
    ): Promise<CustomerModel | null> {
      throw new Error('Method not implemented.');
    }
    find(
      filter: CustomerFilterType,
      options?: FindOptions<Document> | undefined
    ): Promise<CustomerModel[] | null> {
      const address = new AddressModel(
        chance.street(),
        100,
        chance.province(),
        chance.state(),
        chance.city(),
        `${chance.zip()}-000`,
        ''
      );

      const customer = new CustomerModel(
        chance.cpf(),
        chance.name(),
        chance.email(),
        '11 982240000',
        address,
        chance.date(),
        new UniqueEntityIdVO().value
      );

      return Promise.resolve([customer]);
    }
  }

  return new CustomerRepositoryStub();
};

const makeLooger = () => {
  class LoggerStub implements Logger {
    info(message: string): void {
      console.info(message);
    }
    error(message: string): void {
      throw new Error('Method not implemented.');
    }
    warn(message: string): void {
      throw new Error('Method not implemented.');
    }
  }

  return new LoggerStub();
};

const makeSUT = () => {
  const repository = makeRepository();
  const logger = makeLooger();
  const sut = new Search(repository, logger);

  return { sut, repository };
};

describe('# Search Customer Test Integration', () => {
  it('Deve lançar exceção quando Database falhar', async () => {
    const { repository, sut } = makeSUT();

    repository.find = jest
      .fn()
      .mockRejectedValueOnce(new Error('Internal Server Error'));

    await expect(() => sut.execute(chance.word())).rejects.toThrow(
      'Internal Server Error'
    );
  });

  it('Deve retornar vazio quando não encontrado registro', async () => {
    const { repository, sut } = makeSUT();

    repository.find = jest.fn().mockResolvedValueOnce(null);

    expect(await sut.execute(chance.word())).toBeUndefined();
  });

  it('Deve retornar customer corretamente quando encontrado registro pelo filtro informado', async () => {
    const { sut } = makeSUT();

    const customers = await sut.execute(chance.word());

    expect(customers).toBeInstanceOf(Array);
    expect(customers![0]).toBeInstanceOf(Customer)
  });
});
