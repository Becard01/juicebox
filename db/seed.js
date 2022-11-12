const { client, getAllUsers, createUser,
updateUser, 
createPost,
getAllPosts,
updatePost,
getUserById,
createTags,
addTagsToPost
} = require('./index');


async function dropTables() {
    try {
        console.log ("Starting to drop posts tables...");

        await client.query(`
        DROP TABLE IF EXISTS post_tags;
        DROP TABLE IF EXISTS tags;
        DROP TABLE IF EXISTS posts;
        DROP TABLE IF EXISTS users;
    `);

        console.log ("Finished dropping tables!")
    } catch (error){
        console.log("Error dropping tables!")
        throw error;
    }

    try {
        console.log ("Starting to drop users tables...");

        await client.query(`
        DROP TABLE IF EXISTS users;
    `);

        console.log ("Finished dropping users tables!")
    } catch (error){
        console.log("Error dropping users tables!")
        throw error;
    }

    
}

async function createTables(){
    try{
        console.log("Starting to build user tables...")

        await client.query(`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username varchar(255) UNIQUE NOT NULL,
            password varchar(255) NOT NULL,
            name varchar(255) NOT NULL,
            location varchar(255) NOT NULL,
            active BOOLEAN DEFAULT true
        );
     `);
    } catch (error){
        console.log("Error building usertables!");
        throw error;
    }

    try{
        console.log("Starting to build post tables...")

        await client.query(`
        CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id) NOT NULL,
            title varchar(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
        );
     `);
    
     } catch (error){
        console.log("Error building post tables!");
        throw error;
    }

    try{
        console.log("Starting to build tags tables...")

        await client.query(`
        CREATE TABLE tags (
            id SERIAL PRIMARY KEY,
            name varchar(255) NOT NULL
             );
     `);
     } catch (error){
        console.log("Error building tags tables!");
        throw error;
    }

    try{
        console.log("Starting to build post_tag tables...")

        await client.query(`
        CREATE TABLE post_tags (
            "postId" INTEGER REFERENCES posts(id) UNIQUE,
            "tagId" INTEGER REFERENCES tags(id) UNIQUE
            );
     `);
     console.log("Finished building tables!")
     } catch (error){
        console.log("Error building post_tag tables!");
        throw error;
    }

}

async function createInitialUsers() {
    try {
        console.log("Starting to create users...");

        const albert = await createUser({ username: 'albert',
        password: 'bertie99', name: 'Albert', location: 'California'});

        const sandra = await createUser({ username: 'sandra',
        password: '2sandy4me', name: 'Sandra', location: 'Utah'});

        const glamgal = await createUser({ username: 'glamgal',
        password: 'soglam', name: 'Gal', location: 'New York'});

        console.log(albert, sandra, glamgal);

        console.log("Finished creating users!")
    } catch(error){
        console.error("Error creating users!");
        throw error;
    }
}

async function createInitialPosts() {
    
        const [albert, sandra, glamgal] = await getAllUsers();
       
        try{

        console.log("Starting to create initial posts...")
        await createPost({
            authorId: albert.id,
            title: 'First Post',
            content: 'This is my first post. I hope I love writing blogs as mush as I love writing them.',
            tags: ['#happy', '#youcandoanything']
            });
        } catch (error) {
            console.log("Error 1 creating initial posts")
            throw error;
        }
        try{
        await createPost({
            authorId: sandra.id,
            title: "My Very Own Post",
            content: 'I like to post a lot, so get ready World.',
            tags: ["#happy", "#worst-day-ever"]
            });
         } catch (error) {
            console.log("Error 2 creating initial posts")
            throw error;
        }
        try{
        await createPost({
            authorId: glamgal.id,
            title: "Wheres the closest McDonalds?",
            content: "I'm getting hungry.  No time for posting.",
            tags: ["#happy", "#youcandoanything", "catmandoeverything"]
            });
            console.log("Initial Posts Created!")
        } catch (error) {
            console.log("Error 3 creating initial posts")
            throw error;
        }
}



async function rebuildDB(){
    try {
        client.connect();
        await dropTables();
        await createTables();
        await createInitialUsers();
        await createInitialPosts();
       
    } catch (error) {
        console.log ("Error during rebuildDB")
        console.error(error)
    } 
}

async function testDB() {
    try {
        console.log("Starting to TEST database...")

        console.log("Calling getAllUsers")
        const users = await getAllUsers();
        console.log("getAllUsers", users);

        console.log("Calling updateUser on users[0]")
        const updateUserResult = await updateUser (users[0].id, 
            { name: "Newname Sogood",
            location: "Kentucky"
            });
        console.log("updateUserResult:", updateUserResult);

        console.log("Calling getAllPosts");
        const posts = await getAllPosts();
        console.log ("****Result getAllPosts:", posts);

        console.log("Calling updatePost on posts[1], only updating tags");
        console.log ("post[0].id", posts[0].id)
        const updatePostTagsResult = await updatePost(posts[1].id, {
            tags: ["#youcandoanything", "#redfish", "#bluefish"]
        });
        console.log("updatePostTagsResults:", updatePostTagsResult);

        console.log("Calling getUserById with index 1");
        const albert = await getUserById(1);
        console.log("Result getUserById", albert)


        console.log("Finished database tests!")
    }
    catch (error){
        console.log("Error testing database")
        throw error;
    }
}

rebuildDB()
.then(testDB)
.catch(console.error)
.finally(() => client.end());
