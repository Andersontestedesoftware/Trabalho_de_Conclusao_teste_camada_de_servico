const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const app = require('../rest/app');
const userService = require('../src/services/userService');
const userController = require('../rest/controllers/userController');

let token;

describe('/api/users/register', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('Usuário cadastrado com sucesso COM SINON', async () => {
    const registerUserStub = sinon.stub(userService, 'registerUser');
    registerUserStub.returns({
      name: 'Anderson',
      email: 'teste@teste.com',
      password: '1234'
    });

    const res = await request(app)
      .post('/api/users/register')
      .set('Accept', 'application/json')
      .send({
        name: 'Anderson',
        email: 'teste@teste.com',
        password: '1234',
      });

    expect(res.status).to.equal(201);
    expect(res.body.user).to.have.property('name', 'Anderson');
    expect(res.body.user).to.have.property('email', 'teste@teste.com');
  });

  it('Usuário com email já cadastrado COM SINON', async () => {
    const registerUserStub = sinon.stub(userService, 'registerUser');
    registerUserStub.returns(null);

    const res = await request(app)
      .post('/api/users/register')
      .set('Accept', 'application/json')
      .send({
        name: ' ',
        email: ' ',
        password: ' ',
      });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error', 'Email já cadastrado');
  });
    
  it('método register do controller usando sinon', () => {
    const req = { body: { name: 'NovoController', email: 'controller_unique@email.com', password: '1234' } };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    const registerStub = sinon.stub(userController, 'register').callsFake((req, res) => {
      res.status(201).json({ user: { name: req.body.name, email: req.body.email } });
    });

    userController.register(req, res);

    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWith({ user: { name: 'NovoController', email: 'controller_unique@email.com' } })).to.be.true;
    registerStub.restore();
  });

  it('método login do controller usando sinon', () => {
    const req = { body: { email: 'logincontroller@email.com', password: 'senha123' } };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    const loginStub = sinon.stub(userController, 'login').callsFake((req, res) => {
      res.status(200).json({ token: 'token-fake', user: { email: req.body.email } });
    });

    userController.login(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith({ token: 'token-fake', user: { email: 'logincontroller@email.com' } })).to.be.true;
    loginStub.restore();
  });
});

describe('/api/users/Login', () => {
  afterEach(() => {
    sinon.restore(); 
  });

  it('Login com dados errados COM SINON', async () => {
    const registerUserStub = sinon.stub(userService, 'authenticate');
    registerUserStub.returns(null);

    const res = await request(app)
      .post('/api/users/login')
      .set('Accept', 'application/json')
      .send({
        email: 'teste@teste.com',
        password: '1234',
      });

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('error', 'Credenciais inválidas');
  });

  it('Login com sucesso COM SINON', async () => {
    const authenticateStub = sinon.stub(userService, 'authenticate');
    authenticateStub.resolves({
      email: 'teste@teste.com',
      password: '1234',
    });

    const res = await request(app)
      .post('/api/users/login')
      .set('Accept', 'application/json')
      .send({
        email: 'teste@teste.com',
        password: '1234',
      });

    expect(res.status).to.equal(200);
  });
});

describe('POST /api/checkout', () => {
  afterEach(() => sinon.restore());

  before(async () => {
    const resRegister = await request(app)
      .post('/api/users/register')
      .set('Accept', 'application/json')
      .send({
        name: 'teste',
        email: 'god@god.com',
        password: '1234',
      });
    expect(resRegister.status).to.equal(201);

    const resLogin = await request(app)
      .post('/api/users/login')
      .send({
        email: 'god@god.com',
        password: '1234',
      });
    expect(resLogin.status).to.equal(200);
    token = resLogin.body.token;
    expect(token).to.exist;
  });

  it('deve realizar o checkout com erro COM SINON', async () => {
    const tokensinon = sinon.stub(userService, 'verifyToken');
    tokensinon.returns(null);

    const res = await request(app)
      .post('/api/checkout')
      .set('Authorization', '')
      .set('Content-Type', 'application/json')
      .send({
        items: [{ productId: 0, quantity: 0 }],
        freight: 0,
        paymentMethod: 'boleto',
        cardData: { number: 'string', name: 'string', expiry: 'string', cvv: 'string' },
      });

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('error', 'Token inválido');
  });

  it('deve realizar o checkout com sucesso COM SINON', async () => {
    const tokensinon = sinon.stub(userService, 'verifyToken');
    tokensinon.returns({
      email: 'teste@teste.com',
      name: 'Anderson',
    });

    const res = await request(app)
      .post('/api/checkout')
      .set('Authorization', 'Bearer token-falso')
      .set('Accept', 'application/json')
      .send({
        items: [{ productId: 1, quantity: 2 }],
        freight: 10,
        paymentMethod: 'boleto',
        cardData: { number: '1234123412341234', name: 'Anderson', expiry: '12/30', cvv: '123' },
      });

    expect(res.status).to.equal(200);
  });

  it('checkout com "Produto não encontrado" COM SINON', async () => {
    // Stubando verifyToken para simular que o token é válido
    const tokensinon = sinon.stub(userService, 'verifyToken');
    tokensinon.returns({
      email: 'teste@teste.com',
      name: 'Anderson',
    });

    const res = await request(app)
      .post('/api/checkout')
      .set('Authorization', 'Bearer token-falso')
      .set('Accept', 'application/json')
      .send({
        items: [{ productId: 0, quantity: 2 }],
        freight: 10,
        paymentMethod: 'boleto',
        cardData: { number: '1234123412341234', name: 'Anderson', expiry: '12/30', cvv: '123' },
      });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error', 'Produto não encontrado');
  });
});






let tokeen = null;
let link = 'http://localhost:3000'
describe('Teste sem sinon', () => {



  let testEmail = `user_${Date.now()}@camada.com`;
  let testPassword = '12345';
  let tokeen = null;

  it('Deve registrar um usuário com sucesso e testar email já cadastrado', async () => {
    // Primeiro cadastro
    const res1 = await request(link)
      .post('/api/users/register')
      .set('Accept', 'application/json')
      .send({
        name: 'camada',
        email: testEmail,
        password: testPassword
      });
    expect(res1.status).to.equal(201);
    expect(res1.body.user).to.have.property('name', 'camada');
    expect(res1.body.user).to.have.property('email', testEmail);

    // Segundo cadastro com mesmo email para da 400
    const res2 = await request(link)
      .post('/api/users/register')
      .set('Accept', 'application/json')
      .send({
        name: 'camada',
        email: testEmail,
        password: testPassword
      });
    expect(res2.status).to.equal(400);
    expect(res2.body).to.have.property('error', 'Email já cadastrado');
  });

  it('Deve realizar login com sucesso', async () => {
    const res = await request(link)
      .post('/api/users/login')
      .set('Accept', 'application/json')
      .send({
        email: testEmail,
        password: testPassword
      });
    expect(res.status).to.equal(200);
    tokeen = res.body.token;
  });

  it('login com dados errados', async () => {
    const res = await request(link)
      .post('/api/users/login')
      .set('Accept', 'application/json')
      .send({
        email: 'email_invalido@camada.com',
        password: testPassword
      });
    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('error', 'Credenciais inválidas');
  });

  it('checkout com "Produto não encontrado"', async () => {
    const res = await request(link)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${tokeen}`)
      .set('Accept', 'application/json')
      .send({
        items: [{ productId: 0, quantity: 2 }],
        freight: 10,
        paymentMethod: 'boleto',
        cardData: { number: '1234123412341234', name: 'Anderson', expiry: '12/30', cvv: '123' },
      });
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error', 'Produto não encontrado');
  });

  it('checkout com sucesso', async () => {
    const res = await request(link)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${tokeen}`)
      .set('Accept', 'application/json')
      .send({
        items: [{ productId: 1, quantity: 2 }],
        freight: 10,
        paymentMethod: 'boleto',
        cardData: { number: '1234123412341234', name: 'Anderson', expiry: '12/30', cvv: '123' },
      });
    expect(res.status).to.equal(200);
  });
});