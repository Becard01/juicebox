const { Client } = require('pg');

const client = new Client('postgres://localhost:5432/juicebox-dev');

async function createUser({ username, password, name, location }) {
    try {
        const { rows: [user] } = await client.query(`
        INSERT INTO users (username, password, name, location) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING
        RETURNING *;
        `, [username, password, name, location]);
        return user
    }catch (error) {
        console.log ("Error in createUser function")
        throw error;
    }
}

async function updateUser (id, fields ={}) {
    
    const setString = Object.keys(fields).map(
        (key, index) => `"${ key }"=$${ index +1 }`
    ).join(', ');
    
    if (setString.length === 0) {
        return;
    }
    try {
        const { rows: [user] } = await client.query(`
        UPDATE users
        SET ${ setString }
        WHERE id=${ id }
        RETURNING *;
        `, Object.values(fields));

        return user;
    } catch (error) {
        console.log ("Error in updateUser function")
        throw error;
    }
}

async function getAllUsers() {
   try{
    const { rows } = await client.query(`
    SELECT id, username, name, location, active
    FROM users;
    `);
    
    return rows;
   } catch (error){
    console.log ("Error in getAllUsers function")
    throw error
   }
}

async function getUserById(userId){
    try{
        const { rows } = await client.query(`
        SELECT * FROM users
        WHERE id=${ userId };
         `);
     if (!rows || !rows.length){
        return null
     }
     else {
        delete rows.password;
        userPosts = await getPostsByUser(userId);
        rows.posts = userPosts;
        return rows;
     }
    } catch (error) {
        console.log ("Error in getUserById function")
        throw error;
    }
}

async function getUserByUsername(username) {
    try {
      const { rows: [user] } = await client.query(`
        SELECT *
        FROM users
        WHERE username=$1;
      `, [username]);
  
      return user;
    } catch (error) {
        console.log("error in getUserByUsername function")
      throw error;
    }
  }


async function createPost({ authorId, title, content, tags = []}) {
    try {
        const { rows: [ post ] } = await client.query(`
        INSERT INTO posts ("authorId", title, content) 
        VALUES ($1, $2, $3)
        RETURNING *;
        `, [ authorId, title, content ]);

      
        const tagList = await createTags(tags);
      

        return await addTagsToPost(post.id, tagList);
    }catch (error) {
        console.log ("Error in createPost function")
        throw error;
    }
}


async function updatePost (postId, fields = {}) {

    const { tags } = fields;
    delete fields.tags;

    const setString = Object.keys(fields).map(
        (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');

    console.log ("*******setString", setString)
    
    
   try {
    if (setString.length > 0) {
    
        await client.query(`
        UPDATE posts
        SET ${ setString }
        WHERE id=${ postId }
        RETURNING *;
        `, Object.values(fields));
    }

    if (tags === undefined) {
        return await getPostById(postId);
    }

    const tagList = await createTags(tags);
    const tagListIdString = tagList.map(
        tag => `${ tag.id }`
    ).join(', ');

    await client.query(`
    DELETE FROM post_tags
    WHERE "tagId"
    NOT IN (${ tagListIdString })
    AND "postId"=$1;
    `, [postId]);

    await addTagsToPost(postId, tagList);

    return await getPostById(postId);

    } catch (error) {
        console.log ("Error in updatePost function")
        throw error;
    }
}


async function getAllPosts() {
  try{
    const { rows: postIds } = await client.query(`
    SELECT id
    FROM posts;
    `);

    const posts = await Promise.all(postIds.map(
        post => getPostById( post.id )
    ));
    
    return posts;
} catch (error) {
    console.log ("Error in getAllPosts function")
    throw error;
}
}

async function getAllTags() {
    try{
      const { rows } = await client.query(`
      SELECT *
      FROM tags;
      `);
    return rows;
  } catch (error) {
      console.log ("Error in getAllTags function")
      throw error;
  }
  }


async function getPostsByUser(userId) {
    try{
    const { rows: postIds } = await client.query(`
    SELECT id
    FROM posts
    WHERE "authorId"=${ userId };
    `);

    const posts = await Promise.all(postIds.map(
        post => getPostById( post.id )
    ))
    
    return posts;
    } catch (error) {
        console.log ("Error in getPostsByUser function")
        throw error;
    }
}



async function getPostsByTagName(tagName) {
    try{
        const { rows: postIds } = await client.query(`
        SELECT posts.id
        FROM posts
        JOIN post_tags ON posts.id=post_tags."postId"
        JOIN tags ON tags.id=post_tags."tagId"
        WHERE tags.name=$1;
        `, [tagName]);

        return await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));
    }catch (error) {
        console.log ("Error in getPostsByTagName function")
        throw error;
    }
}


async function createTags(tagList) {
    if  (tagList.length === 0) {
        return;
    }
    const insertValues = tagList.map(
  (_, index) => `($${index + 1})`).join(', ');     
    console.log ("****insertValues", insertValues)
    try {
        await client.query(`
        INSERT INTO tags(name) 
        VALUES ${ insertValues }
        ON CONFLICT (name) DO NOTHING;
        `, Object.values(tagList));
        
    }catch (error) {
        console.log ("Error in createTags/insertValues function")
        throw error;
    }
    const selectValues = tagList.map(
        (_, index) => `$${index + 1}`).join(', '); 

        console.log ("****selectValues", selectValues)    
          
          try {
              const { rows } = await client.query(`
              SELECT * FROM tags
              WHERE name
              IN (${ selectValues });
              `, Object.values(tagList));
              
              console.log ("Selected Tags", rows)
              return rows
          }catch (error) {
            console.log ("Error in createTags/selectValues function")
              throw error;
          }
}

async function createPostTag(postId, tagId) {
    
    try{
        await client.query(`
        INSERT INTO post_tags("postId", "tagId")
        VALUES ($1, $2)
        ON CONFLICT ("postId", "tagId") DO NOTHING;
        `, [postId, tagId]);
        
    }catch (error) {
        console.log ("error createPostTag function")
        throw error;
    }
}

async function addTagsToPost(postId, tagList) {
   
    try {
        const createPostTagPromises = tagList.map(
            tag => createPostTag(postId, tag.id)
        );
        console.log ("createPostTagPromises", createPostTagPromises)
        
        await Promise.all(createPostTagPromises);

        return await getPostById(postId);

        } catch (error) {
            console.log ("Error in addTagsToPost function")
        throw error;
    }
}

async function getPostById (postId) {
    
    try{
        const { rows: [ post ] } = await client.query (`
        SELECT *
        FROM posts
        WHERE id= $1;
        `,[postId])

        console.log ("getPostById post", post)
        if (!post) {
            console.log (
              name, "PostNotFoundError",
              message, "Could not find a post with that postId"
            );
          }
        
        const { rows: tags } = await client.query(`
        SELECT tags.*
        FROM tags
        JOIN post_tags ON tags.id=post_tags."tagId"
        WHERE post_tags."postId" = $1;
        `, [postId])
        
        console.log ("getPostById tags", tags)
        

        const {rows: [author]} = await client.query(`
        SELECT id, username, name, location
        FROM users
        WHERE id = $1;
        `, [post.authorId])

        console.log ("getPostById author", author)

        post.tags = tags;
        post.author = author;

        delete post.authorId;
       
        return post;
    } catch (error) {
        console.log ("Error in getPostById function")
        throw error;
    }
}


module.exports = {
    client,
    getAllUsers,
    createUser,
    updateUser,
    createPost,
    updatePost, 
    getAllPosts,
    getPostsByUser,
    getUserById,
    createTags,
    createPostTag,
    addTagsToPost,
    getPostById, 
    getPostsByTagName,
    getAllTags,
    getUserByUsername
}
