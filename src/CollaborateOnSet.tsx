import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Select, MenuItem, FormControl, InputLabel, Typography, List, ListItem, ListItemText } from '@material-ui/core';
import { useParams } from 'react-router-dom';

const CollaborateOnSet: React.FC = () => {
    const [sets, setSets] = useState<any[]>([]);
    const [selectedSet, setSelectedSet] = useState<string>('');
    const [maxCollaborators, setMaxCollaborators] = useState<number>(1);
    const [potentialCollaborations, setPotentialCollaborations] = useState<any[]>([]);
    const { username } = useParams(); // This will get the 'username' from the URL

    interface CombinedInventory {
        [pieceId: string]: {
            [color: string]: number;
        };
    }
    interface User {
        id: string;
        username: string;
        collection: Piece[];
        // define other properties if needed  
    }

    interface Piece {
        pieceId: string;
        variants: Variant[];
        // define other properties if needed  
    }

    interface Variant {
        color: string;
        count: number;
        // define other properties if needed  
    }

    useEffect(() => {
        const fetchSets = async () => {
            try {
                const response = await axios.get('https://d16m5wbro86fg2.cloudfront.net/api/sets');
                setSets(response.data.Sets);
            } catch (error) {
                console.error('Error fetching sets:', error);
            }
        };

        fetchSets();
    }, []);

    const handleSetChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setSelectedSet(event.target.value as string);
    };

    const handleCollaboratorChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setMaxCollaborators(event.target.value as number);
    };

    const findCollaborations = async () => {
        try {
            // First, get the specific user's ID by their username
            const userResponse = await axios.get(`https://d16m5wbro86fg2.cloudfront.net/api/user/by-username/${username}`);
            const userId = userResponse.data.id;
            // Then, fetch the specific user's collection using their ID
            const specificUserResponse = await axios.get(`https://d16m5wbro86fg2.cloudfront.net/api/user/by-id/${userId}`);
            const specificUser = specificUserResponse.data;

            const setResponse = await axios.get<{ pieces: Piece[] }>(`https://d16m5wbro86fg2.cloudfront.net/api/set/by-id/${selectedSet}`);
            const requiredPieces = setResponse.data.pieces;

            const usersResponse = await axios.get<{ Users: User[] }>('https://d16m5wbro86fg2.cloudfront.net/api/users');
            var users = usersResponse.data.Users.filter(user => user.id !== userId); // Exclude the specific user from the users list

            // Fetch collections for all users except the specific user
            const collections = await Promise.all(users.map(user =>
                axios.get<{ collection: Piece[] }>(`https://d16m5wbro86fg2.cloudfront.net/api/user/by-id/${user.id}`)
            ));
            users = users.map((user, index) => ({ ...user, collection: collections[index].data.collection }));

            // Correct the initial call to include specificUser
            var foundCollaborations = findCollaborationCombinations(users, requiredPieces, maxCollaborators, 0, 0, [specificUser]);
            setPotentialCollaborations(foundCollaborations);
        } catch (error) {
            console.error('Error finding collaborations:', error);
        }
    };




    // About time complexity:
    /*
    focusing on the findCollaborationCombinations function below, 
    which has the most computationally intensive part of this component, 
    it appears to have a time complexity of O(n^m), where n is the number of users and m is the maximum depth (maxCollaborators + 1). 
    This is because for each user, it recursively checks all combinations of users up to the maximum depth.
    */

    // Recursive function to find combinations of users who can collaborate to build the set
    const findCollaborationCombinations = (users: any[], requiredPieces: any[], maxDepth: number, currentDepth: number = 0, startIndex: number = 0, currentCombination: any[] = []): any[] => {
        if (currentDepth >= maxDepth) {
            var combinedInventory = combineInventories(currentCombination);
            var isFulfilled = checkIfRequirementsFulfilled(combinedInventory, requiredPieces);
            return isFulfilled ? [currentCombination.map(user => user.username)] : [];
        } else {
            var combinations = [];
            for (var i = startIndex; i < users.length; i++) {
                var newCombination = [...currentCombination, users[i]];
                combinations.push(...findCollaborationCombinations(users, requiredPieces, maxDepth, currentDepth + 1, i + 1, newCombination));
            }
            return combinations;
        }
    };



    // Combine the inventories of a given set of users
    const combineInventories = (users: any[]): CombinedInventory => {
        var combined: CombinedInventory = {};
        users.forEach(user => {
            if (user.collection) {
                user.collection.forEach((item: any) => {
                    if (!combined[item.pieceId]) {
                        combined[item.pieceId] = {};
                    }
                    if (item.variants) {
                        item.variants.forEach((variant: any) => {
                            if (!combined[item.pieceId][variant.color]) {
                                combined[item.pieceId][variant.color] = 0;
                            }
                            combined[item.pieceId][variant.color] += variant.count;
                        });
                    }
                });
            }
        });
        return combined;
    };



    // Check if a combined inventory fulfills all the requirements for the set
    const checkIfRequirementsFulfilled = (inventory: any, requirements: any[]): boolean => {
        return requirements.every(req => {
            var piece = inventory[req.part.designID];
            return piece && piece[req.part.material.toString()] && piece[req.part.material.toString()] >= req.quantity;
        });
    };

    return (
        <div>
            <FormControl fullWidth margin="normal">
                <InputLabel id="set-select-label">Select a Set</InputLabel>
                <Select labelId="set-select-label" value={selectedSet} onChange={handleSetChange} fullWidth>
                    {sets.map((set) => (
                        <MenuItem key={set.id} value={set.id}>{set.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
                <InputLabel id="collaborator-select-label">Max Collaborators</InputLabel>
                <Select labelId="collaborator-select-label" value={maxCollaborators} onChange={handleCollaboratorChange} fullWidth>
                    {[1, 2, 3, 4, 5].map((number) => (
                        <MenuItem key={number} value={number}>{number}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Button variant="contained" color="primary" onClick={findCollaborations} style={{ marginTop: '20px' }}>
                Find Collaborations
            </Button>

            {potentialCollaborations.length > 0 && (
                <>
                    <Typography variant="h6" style={{ marginTop: '20px' }}>Potential Collaborations:</Typography>
                    <List style={{ maxHeight: '300px', overflow: 'auto' }}>
                        {potentialCollaborations.map((collab, index) => (
                            <ListItem key={index}>
                                <ListItemText primary={`Collaboration between: ${collab.join(', ')}`} />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
        </div>
    );
};

export default CollaborateOnSet;
