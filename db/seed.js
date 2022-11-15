const { client, getAllUsers, createUser,
updateUser, 
createPost,
getAllPosts,
updatePost,
getUserById,
createTags,
addTagsToPost,
getPostsByTagName, 
getPostsByUser
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
}



async function createTables(){
    try{
        console.log("Starting to build tables...")

        await client.query(`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username varchar(255) UNIQUE NOT NULL,
            password varchar(255) NOT NULL,
            name varchar(255) NOT NULL,
            location varchar(255) NOT NULL,
            active BOOLEAN DEFAULT true
        );
        CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id) NOT NULL,
            title varchar(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
        );
        CREATE TABLE tags (
            id SERIAL PRIMARY KEY,
            name varchar(255) NOT NULL
        );
        CREATE TABLE post_tags (
            "postId" INTEGER REFERENCES posts(id),
            "tagId" INTEGER REFERENCES tags(id),
            UNIQUE("postId", "tagId")
        );
            
 `);
 console.log("Finished building tables!")
    } catch (error){
        console.log("Error building Tables!");
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

        console.log("***************88888888", albert, sandra, glamgal)

        console.log("Finished creating users!")
    } catch(error){
        console.error("Error creating users!");
        throw error;
    }
}

async function createInitialPosts() {
    
        try{

        const [albert, sandra, glamgal] = await getAllUsers();

       console.log

        console.log("Starting to create initial posts...")
        
        await createPost({
            authorId: albert.id,
            title: "First Post",
            content: "This is my first post. I hope I love writing blogs as mush as I love writing them.",
            tags: ['#happy', '#youcandoanything']
            });

            await createPost({
                authorId: sandra.id,
                title: "My Very Own Post",
                content: "I like to post a lot, so get ready World.",
                tags: ["#happy", "#worst-day-ever"]
                });
             
            await createPost({
                authorId: glamgal.id,
                title: "Wheres the closest McDonalds?",
                content: "I'm getting hungry.  No time for posting.",
                tags: ["#happy", "#youcandoanything", "catmandoeverything"]
                });
        
       
            console.log("Initial Posts Created!")
        } catch (error) {
            console.log("Error creating initial posts")
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
        console.log("Testing result getAllUsers:", users);

        console.log("Calling updateUser on users[0]")
        const updateUserResult = await updateUser (users[0].id, 
            { name: "Newname Sogood",
            location: "Kentucky"
            });
        console.log("Testing result updateUserResult:", updateUserResult);

        console.log("Calling getAllPosts");
        const posts = await getAllPosts();
        console.log ("Testing Result getAllPosts:", posts);

        //**** */
        console.log("Calling getUserById with index 1");
        const albert = await getUserById(1);
        console.log("Testing Result getUserById", albert)
        //**** */
        console.log("Calling getPostsByTagName with #happy");
        const postsWithHappy = await getPostsByTagName("#happy");
        console.log("Testing Result postsWithHappy", postsWithHappy)

        //**** */
        console.log("Calling updatePost on posts[1], only updating tags");
        console.log ("post[1].id", posts[1].id)
        const updatePostTagsResult = await updatePost(posts[1].id, {
            tags: ["#youcandoanything", "#redfish", "#bluefish"]
        });
        console.log("Testing Result updatePostTagsResults:", updatePostTagsResult);

        

       

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
