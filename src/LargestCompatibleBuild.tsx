import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, List, ListItem, ListItemText, Box } from '@material-ui/core';
import { colorsData } from './colorsData';


interface User {
    id: string;
    username: string;
}

interface Piece {
    pieceId: string;
    variants: Variant[];
}

interface Variant {
    color: string;
    count: number;
}

interface UserPieceCount {
    [key: string]: {
        usersWithPiece: Set<string>; // Use a Set to track unique user IDs
        pieceId: string;
        color: string; // Assuming each variant's uniqueness is defined by pieceId-color pair
    };
}

interface CommonPiece {
    pieceId: string;
    color: string;
    colorName: string;
    totalUsers: number;
}



const LargestCompatibleBuild: React.FC = () => {
    const [commonPieces, setCommonPieces] = useState<CommonPiece[]>([]);

    useEffect(() => {
        const fetchInventories = async () => {
            try {
                const usersResponse = await axios.get<{ Users: User[] }>('https://d16m5wbro86fg2.cloudfront.net/api/users');
                const users = usersResponse.data.Users;
                let userPieceCounts: UserPieceCount = {};

                // Fetch the inventories for all users
                const inventoriesResponses = await Promise.all(users.map(user =>
                    axios.get<{ collection: Piece[] }>(`https://d16m5wbro86fg2.cloudfront.net/api/user/by-id/${user.id}`)
                ));

                inventoriesResponses.forEach((inventoryResponse, userIndex) => {
                    const inventory = inventoryResponse.data.collection;
                    inventory.forEach(piece => {
                        piece.variants.forEach(variant => {
                            const key = `${piece.pieceId}-${variant.color}`;
                            if (!userPieceCounts[key]) {
                                userPieceCounts[key] = { usersWithPiece: new Set(), pieceId: piece.pieceId, color: variant.color };
                            }
                            userPieceCounts[key].usersWithPiece.add(users[userIndex].id);
                        });
                    });
                });

                const threshold = users.length / 2;
                const commonPiecesArray: CommonPiece[] = Object.values(userPieceCounts)
                    .filter(pieceCount => pieceCount.usersWithPiece.size >= threshold)
                    .map(pieceCount => ({
                        pieceId: pieceCount.pieceId,
                        color: pieceCount.color,
                        colorName: colorsData[pieceCount.color]?.name || "Unknown",
                        totalUsers: pieceCount.usersWithPiece.size
                    }))
                    .sort((a, b) => b.totalUsers - a.totalUsers); // This line adds sorting by totalUsers in descending order

                setCommonPieces(commonPiecesArray);

            } catch (error) {
                console.error('Error fetching inventories:', error);
            }
        };

        fetchInventories();
    }, []);

    return (
        <div>
            {commonPieces.length > 0 ? (
                <>
                    <Typography variant="h6" style={{ marginTop: '20px' }}>Pieces Available to Most Users:</Typography>
                    <List style={{ maxHeight: '300px', overflow: 'auto' }}>
                        {commonPieces.map((piece, index) => (
                            <ListItem key={index}>
                                <ListItemText primary={`Piece ID: ${piece.pieceId}, Color: ${piece.colorName}, Users Owning: ${piece.totalUsers}`} />
                                <Box display="inline-block" width={20} height={20} bgcolor={colorsData[piece.color]?.hex || "#FFFFFF"} marginLeft={2} border={1} />
                            </ListItem>
                        ))}
                    </List>
                </>
            ) : (
                <Typography variant="body1" style={{ marginTop: '20px' }}>Calculating common pieces...</Typography>
            )}
        </div>
    );
};

export default LargestCompatibleBuild;

