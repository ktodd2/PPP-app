const { createUser } = require('./server/create-user.ts');

async function addTestUsers() {
  try {
    console.log('Creating test users...');
    
    await createUser('admin', 'admin123');
    await createUser('john', 'password');
    await createUser('employee1', 'emp123');
    
    console.log('All test users created successfully!');
    console.log('\nLogin credentials:');
    console.log('Username: admin, Password: admin123');
    console.log('Username: john, Password: password');
    console.log('Username: employee1, Password: emp123');
    
  } catch (error) {
    console.error('Error creating users:', error);
  }
}

addTestUsers();