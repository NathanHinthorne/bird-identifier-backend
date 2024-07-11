/*
==============================================================
1. Setup
    a. Import necessary things
    b. Define a new router
==============================================================
*/

//express is the framework we're going to use to handle requests
import express, { NextFunction, Request, Response, Router } from 'express';

//Access the connection to Postgres Database
import { pool, validationFunctions } from '../../core/utilities';

// Import the interfaces for typechecking
import { IBird, INames, IPhotos } from '../../core/models/bird';

const birdRouter: Router = express.Router();



/*
==============================================================
2. Middlewear functions
a. These are functions that have access to 
the request object (req), the response object (res), 
and the next middleware function in the application’s 
request-response cycle. 
b. They can perform tasks like input validation, logging, 
or modifying the request/response objects.
==============================================================
*/
const isStringProvided = validationFunctions.isStringProvided;
const isNumberProvided = validationFunctions.isNumberProvided;

function mwValidBirdsBody(
    request: Request,
    response: Response,
    next: NextFunction
) {
    if (Array.isArray(request.body.birds)) {
        next();
    } else {
        console.error('Invalid or missing Birds');
        response.status(400).send({
            message:
                'Invalid or missing Bird - please refer to documentation',
        });
    }
}

/*
==============================================================
3. Endpoint handlers
    a. Define endpoints using get/put/post/delete.
    b. These will respond to HTTP requests made to specific paths.
==============================================================
*/

/**
 * This defines what a "bird" object looks like.
 * It keeps us from typing the bird object out multiple times.
 *
 * This particular one is for whenever we need to return a bird object.
 *
 * @apiDefine BirdSuccess
 * @apiSuccess {String} bird.formattedComName The common name of the bird without whitespace
 * @apiSuccess {String} bird.comName The common name of the bird
 * @apiSuccess {String} bird.sciName The scientific name of the bird
 * @apiSuccess {String} bird.previewPhoto The preview photo of the bird
 * @apiSuccess {String} bird.maleBreedingPhoto The photo of the male bird in breeding plumage
 * @apiSuccess {String} bird.maleNonbreedingPhoto The photo of the male bird in non-breeding plumage
 * @apiSuccess {String} bird.femalePhoto The photo of the female bird
 * @apiSuccess {String} bird.sound The most prominant call/song of the bird
 * @apiSuccess {String} bird.shortDesc The short description of the bird
 * @apiSuccess {String} bird.longDesc The short description of the bird
 * @apiSuccess {String} bird.howToFind The text for how to find this bird
 * @apiSuccess {String} bird.habitat The text for where this bird is found
 * @apiSuccess {String} bird.learnMoreLink The link to learn more about this bird
 */

/**
 * This defines what a "bird" object looks like.
 * It keeps us from typing the bird object out multiple times.
 *
 * This particular one is for whenever we need a bird object as input in the body.
 *
 * @apiDefine BirdBody
 * @apiBody {String} bird.formattedComName The common name of the bird without whitespace
 * @apiBody {String} bird.comName The common name of the bird
 * @apiBody {String} bird.sciName The scientific name of the bird
 * @apiBody {String} bird.previewPhoto The preview photo of the bird
 * @apiBody {String} bird.maleBreedingPhoto The photo of the male bird in breeding plumage
 * @apiBody {String} bird.maleNonbreedingPhoto The photo of the male bird in non-breeding plumage
 * @apiBody {String} bird.femalePhoto The photo of the female bird
 * @apiBody {String} bird.sound The most prominant call/song of the bird
 * @apiBody {String} bird.shortDesc The short description of the bird
 * @apiBody {String} bird.longDesc The short description of the bird
 * @apiBody {String} bird.howToFind The text for how to find this bird
 * @apiBody {String} bird.habitat The text for where this bird is found
 * @apiBody {String} bird.learnMoreLink The link to learn more about this bird
 */

// ---------------- GET ----------------

/**
 * @api {get} /birds Get all birds
 *
 * @apiDescription Get all birds in the database
 *
 * @apiName GetAllBirds
 * @apiGroup User
 *
 * @apiSuccess {Object[]}  The list of birds in the database
 * @apiUse BirdSuccess
 *
 * @apiError (404: Birds Not Found) {String} message No birds were found in the database
 */
birdRouter.get('/all', (request: Request, response: Response) => {
    const theQuery = 'SELECT * FROM Birds';

    pool.query(theQuery)
        .then((result) => {
            if (result.rowCount >= 1) {
                const birds: IBird[] = result.rows;
                response.json(birds);

            } else {
                response.status(404).send({
                    message: 'No birds were found in the database',
                });
            }
        })
        .catch((error) => {
            //log the error
            console.error('DB Query error on GET all');
            console.error(error);
            response.status(500).send({
                message: 'server error - contact support',
            });
        });
});


/**
 * @api {get} /birds Get birds by names
 * 
 * @apiDescription Get birds by names
 * 
 * @apiName GetBirdsByNames
 * @apiGroup User
 * 
 * @apiBody {String[]} birds The names of the birds
 * 
 * @apiSuccess {Object[]} birds The list of birds with the provided names
 * @apiUse BirdSuccess
 * 
 * @apiError (400: Missing or Invalid Body) {String} message "Invalid or missing Birds - please refer to documentation"
 */
birdRouter.get(
    '/',
    mwValidBirdsBody,
    (request: Request, response: Response) => {
        const birdNames = request.body.birdNames;
        // We use placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        const placeholders = birdNames.map((_, i) => `$${i + 1}`).join(','); // $1, $2, $3, etc.
        const theQuery = `SELECT * FROM Birds WHERE Formatted_Com_Name IN (${placeholders});`;

        /*
        considering that I'm using the eBird API in the frontend to obtain bird names 
        that MIGHT NOT be in the db, don't throw an error if certain birds 
        aren't in the db, but rather exclude those birds from the results
        */
        
        pool.query(theQuery, birdNames)
            .then((result) => {
                const birds: IBird[] = result.rows;
                response.json(birds);
            })
            .catch((err) => {
                response.status(400).send({
                    message: 'Error: ' + err.detail,
                });
            });
    }
);



// ---------------- PUT ----------------

// update bird in the database by giving formattedComName in route param, and new fields in body
/**
 * @api {put} /birds/:formattedComName Update a bird
 * 
 * @apiDescription Update a bird in the database
 * 
 * @apiName UpdateBird
 * @apiGroup Admin
 * 
 * @apiParam {String} formattedComName The formatted common name of the bird
 * 
 * @apiUse BirdBody
 * 
 * @apiSuccess {Object} bird The updated bird
 * @apiUse BirdSuccess
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * @apiError (404: Not Found) {String} message "No bird found with the provided name"
 */
birdRouter.put(
    '/:formattedComName',
    (request: Request, response: Response) => {
        const birdName = request.params.formattedComName;
        const theQuery = `UPDATE birds SET Com_Name = $1, Sci_Name = $2, Preview_Photo = $3, 
            Male_Breeding_Photo = $4, Male_Nonbreeding_Photo = $5, Female_Photo = $6, Sound = $7,
            Short_Desc = $8, Long_Desc = $9, How_To_Find = $10, Habitat = $11, Learn_More_Link = $12
            WHERE Formatted_Com_Name = $13 RETURNING *;`;

        pool.query(theQuery, [
            request.body.comName,
            request.body.sciName,
            request.body.previewPhoto,
            request.body.maleBreedingPhoto,
            request.body.maleNonbreedingPhoto,
            request.body.femalePhoto,
            request.body.sound,
            request.body.shortDesc,
            request.body.longDesc,
            request.body.howToFind,
            request.body.habitat,
            request.body.learnMoreLink,
            birdName,
        ])
            .then((result) => {
                if (result.rowCount > 0) {
                    response.json(result.rows[0]);
                } else {
                    response.status(404).send({
                        message: 'No bird found with the provided name.',
                    });
                }
            })
            .catch((err) => {
                response.status(400).send({
                    message: 'Error: ' + err.detail,
                });
            });
    }
);



// ---------------- POST ----------------

// add bird to the database by giving ALL fields in body (including formattedComName)
/**
 * @api {post} /birds Add a bird
 * 
 * @apiDescription Add a bird to the database
 * 
 * @apiName AddBird
 * @apiGroup Admin
 * 
 * @apiUse BirdBody
 * 
 * @apiSuccess {Object} bird The added bird
 * @apiUse BirdSuccess
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 */
birdRouter.post(
    '/',
    (request: Request, response: Response) => {
        const theQuery = `INSERT INTO birds (Formatted_Com_Name, Com_Name, Sci_Name, Preview_Photo,
            Male_Breeding_Photo, Male_Nonbreeding_Photo, Female_Photo, Sound, Short_Desc, Long_Desc,
            How_To_Find, Habitat, Learn_More_Link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13) RETURNING *;`;

        pool.query(theQuery, [
            request.body.formattedComName,
            request.body.comName,
            request.body.sciName,
            request.body.previewPhoto,
            request.body.maleBreedingPhoto,
            request.body.maleNonbreedingPhoto,
            request.body.femalePhoto,
            request.body.sound,
            request.body.shortDesc,
            request.body.longDesc,
            request.body.howToFind,
            request.body.habitat,
            request.body.learnMoreLink,
        ])
            .then((result) => {
                response.json(result.rows[0]);
            })
            .catch((err) => {
                response.status(400).send({
                    message: 'Error: ' + err.detail,
                });
            });
    }
);



// ---------------- DELETE ----------------

/**
 * @api {delete} /birds Delete birds by name
 *
 * @apiDescription Delete one or more birds by name
 *
 * @apiName DeleteBirds
 * @apiGroup Admin
 *
 * @apiBody {String[]} birds array of Birds. Can be one or more
 *
 * @apiSuccess {String} message The number of books deleted
 * @apiSuccess {String[]} birdNames The names of the birds that were deleted
 * 
 * @apiError (400: Bad Request) {String} message An error occurred during query execution
 * @apiError (404: Not Found) {String} message No birds found with the provided names
 */
birdRouter.delete(
    '/',
    // mwValidISBNArray,
    (request: Request, response: Response) => {
        const birdNames = request.body.names;
        const placeholders = birdNames.map((_, i) => `$${i + 1}`).join(','); // $1, $2, $3, etc.
        const theQuery = `DELETE FROM Birds WHERE Formatted_Com_Name IN (${placeholders});`;

        pool.query(theQuery, birdNames)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({ message: `${result.rowCount} bird(s) deleted successfully.`, birdNames: birdNames });
                } else {
                    response.status(404).send({ message: 'No birds found with the provided names.', birdNames: birdNames });
                }
            })
            .catch((err) => {
                response.status(400).send({
                    message: 'Error: ' + err.detail,
                });
            });
    }
);


// "return" the router
export { birdRouter };
