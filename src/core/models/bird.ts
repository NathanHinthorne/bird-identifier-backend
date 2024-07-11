export interface INames {
    formattedComName: string;
    comName: string;
    sciName: string;
}

export interface IPhotos {
    previewPhoto: string;
    maleBreedingPhoto: string;
    maleNonbreedingPhoto: string;
    femalePhoto: string;
}

export interface IBird {
    names: INames;
    photos: IPhotos;
    sound: string;
    shortDesc: string;
    longDesc: string;
    howToFind: string;
    habitat: string;
    learnMoreLink: string;
}
