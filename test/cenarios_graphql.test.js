const request = require('supertest');
const app = require('../graphql/app');
const { expect } = require('chai');

describe('GraphQL API', () => {
    	it('deve registrar novo usuário', async () => {
		const mutation = {
			query: 'mutation { register(name: "Anderson", email: "god@god.com", password: "123456") { name email } }'
		};
		const res = await request(app)
			.post('/graphql')
			.send(mutation);
		expect(res.status).to.equal(200);
		expect(res.body.data.register).to.deep.equal({name: "Anderson", email: "god@god.com"});
	});


	it('deve consultar usuários', async () => {
		const query = {
			query: '{ users { name email } }'
		};
		const res = await request(app)
			.post('/graphql')
			.send(query);
		expect(res.status).to.equal(200);
		expect(res.body.data.users).to.be.an('array');
		expect(res.body.data.users).to.deep.include({ name: "Anderson", email: "god@god.com" });
	});

	it('deve fazer login', async () => {
		const mutation = {
			query: 'mutation { login(email: "god@god.com", password: "123456") { token user { name email } } }'
		};
		const res = await request(app)
			.post('/graphql')
			.send(mutation);
		expect(res.status).to.equal(200);
		expect(res.body.data).to.exist;
		expect(res.body.data.login).to.exist;
		expect(res.body.data.login.token).to.exist;
		expect(res.body.data.login.user).to.deep.equal({name: "Anderson", email: "god@god.com"});
	});

	it('deve realizar checkout', async () => {
		// Primeiro, login para obter token
		const loginMutation = {
			query: 'mutation { login(email: "god@god.com", password: "123456") { token } }'
		};
		const loginRes = await request(app)
			.post('/graphql')
			.send(loginMutation);
		expect(loginRes.status).to.equal(200);
		const token = loginRes.body.data.login.token;

		const checkoutMutation = {
			query: `mutation {
				checkout(
					items: [{ productId: 1, quantity: 2 }],
					freight: 10,
					paymentMethod: "credit_card",
					cardData: { number: "1234", name: "Alice", expiry: "12/25", cvv: "123" }
				) {
					userId
					valorFinal
					paymentMethod
					freight
					items { productId quantity }
				}
			}`
		};
		const res = await request(app)
			.post('/graphql')
			.set('Authorization', `Bearer ${token}`)
			.send(checkoutMutation);
		expect(res.status).to.equal(200);
		expect(res.body.data.checkout.userId).to.exist;
		expect(res.body.data.checkout.valorFinal).to.be.above(0);
		expect(res.body.data.checkout.paymentMethod).to.equal('credit_card');
		expect(res.body.data.checkout.items[0]).to.deep.equal({ productId: 1, quantity: 2 });
	});
});
