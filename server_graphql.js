const app = require('./graphql/app');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`GraphQL server running on port ${PORT}`);
});
