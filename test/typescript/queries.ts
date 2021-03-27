import { Schema, model, Document, Types, Query, Model, QueryWithHelpers } from 'mongoose';

interface QueryHelpers {
  byName(name: string): QueryWithHelpers<Array<ITest>, ITest, QueryHelpers>;
}

const schema: Schema<ITest, Model<ITest, QueryHelpers>> = new Schema({
  name: { type: 'String' },
  tags: [String],
  docs: [{ nested: { id: Number } }]
});

schema.query.byName = function(name: string): Query<any, ITest, QueryHelpers> & QueryHelpers {
  return this.find({ name });
};

interface ISubdoc extends Document {
  id?: number;
}

interface ITest extends Document {
  name?: string;
  age?: number;
  parent?: Types.ObjectId;
  tags?: string[];
  docs?: ISubdoc[];
}

const Test = model<ITest, Model<ITest, QueryHelpers>>('Test', schema);

Test.find().byName('test').byName('test2').orFail().exec().then(console.log);

Test.count({ name: /Test/ }).exec().then((res: number) => console.log(res));
Test.findOne({ 'docs.id': 42 }).exec().then(console.log);

// ObjectId casting
Test.find({ parent: new Types.ObjectId('0'.repeat(24)) });
Test.find({ parent: '0'.repeat(24) });

// Operators
Test.find({ name: { $in: ['Test'] } }).exec().then((res: Array<ITest>) => console.log(res));

Test.find({ name: 'test' }, (err: Error, docs: ITest[]) => {
  console.log(!!err, docs[0].age);
});

Test.findOne({ name: 'test' }, (err: Error, doc: ITest) => {
  console.log(!!err, doc.age);
});

Test.find({ name: { $gte: 'Test' } }, null, { collation: { locale: 'en-us' } }).exec().
  then((res: Array<ITest>) => console.log(res[0].name));

Test.findOne().orFail(new Error('bar')).then((doc: ITest | null) => console.log('Found! ' + doc));

Test.distinct('name').exec().then((res: Array<any>) => console.log(res[0]));

Test.findOneAndUpdate({ name: 'test' }, { name: 'test2' }).exec().then((res: ITest | null) => console.log(res));
Test.findOneAndUpdate({ name: 'test' }, { name: 'test2' }).then((res: ITest | null) => console.log(res));
Test.findOneAndUpdate({ name: 'test' }, { $set: { name: 'test2' } }).then((res: ITest | null) => console.log(res));
Test.findOneAndUpdate({ name: 'test' }, { $inc: { age: 2 } }).then((res: ITest | null) => console.log(res));
Test.findOneAndUpdate({ name: 'test' }, { name: 'test3' }, { upsert: true, new: true }).then((res: ITest) => { res.name = 'test4'; });
Test.findOneAndUpdate({ name: 'test' }, { name: 'test3' }, { upsert: true, returnOriginal: false }).then((res: ITest) => { res.name = 'test4'; });
Test.findOneAndUpdate({ name: 'test' }, { name: 'test3' }, { rawResult: true }).then((res: any) => { console.log(res.ok); });
Test.findOneAndUpdate({ name: 'test' }, { name: 'test3' }, { new: true, upsert: true, rawResult: true }).then((res: any) => { console.log(res.ok); });

Test.findOneAndReplace({ name: 'test' }, { _id: new Types.ObjectId(), name: 'test2' }).exec().then((res: ITest | null) => console.log(res));

Test.findOneAndUpdate({ name: 'test' }, { $addToSet: { tags: 'each' } });
Test.findOneAndUpdate({ name: 'test' }, { $push: { tags: 'each' } });
Test.findOneAndUpdate({ name: 'test' }, { $pull: { docs: { 'nested.id': 1 } } });

Test.findByIdAndUpdate({ name: 'test' }, { name: 'test2' }, (err, doc) => console.log(doc));

const query: Query<ITest | null, ITest> = Test.findOne();
query instanceof Query;

// Chaining
Test.findOne().where({ name: 'test' });
Test.where().find({ name: 'test' });

// Super generic query
function testGenericQuery(): void {
  interface CommonInterface<T> extends Document {
    something: string;
    content: T;
  }

  async function findSomething<T>(model: Model<CommonInterface<T>>): Promise<CommonInterface<T>> {
    return model.findOne({ something: 'test' }).orFail().exec();
  }
}