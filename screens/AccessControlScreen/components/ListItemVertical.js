import { prepareDataForValidation } from "formik";
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Permissions from 'expo-permissions';
import * as Sharing from "expo-sharing";
import { AuthContext } from "../../../contexts/authContext";
import {userContext} from '../../../contexts/userContext';
import { serverURL } from "../../../appConfig";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Button,
  TouchableOpacity,
} from "react-native";
 
expoFileLocation = "";
fileData = "";
fileName = "";
async function getFile(name,token,username) {
  try {
    let response = await fetch(serverURL + "api/web/user/file/get", {
      method: "POST",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Accept: "text/html",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        fileName: name,
        user:username,
        path: "/",
      }),
    });
    if(response.status == 200) {
        var jsonResponse = await response.json();
        if(jsonResponse.hasOwnProperty('error')) {
          alert("Datoteka ne postoji!");
        }
        else if(jsonResponse.hasOwnProperty('fileName')) {
          fileData = jsonResponse["base64"];
          fileName = jsonResponse["fileName"];
          await saveToExpoFileSystem();
          await copyFromExpoFSToLocalFS();
        }
    }
    else if(response.status == 503) {
      alert("Servis nedostupan");
    }
    else if(response.status == 403) {
      //invalid token, trebalo bi dobaviti novi
    }
    else if(response.status == 404) {
      alert("Datoteka vise ne postoji");
    }
    else {
      console.log("Promijenjen JSON zahtjeva?");
      alert("Greska pri preuzimanju datoteke");
    }
  } catch (error) {
    console.log(error);
  }
}
 
async function saveToExpoFileSystem() {
  expoFileLocation = FileSystem.documentDirectory + fileName;
  FileSystem.writeAsStringAsync(expoFileLocation, fileData, {
    encoding: FileSystem.EncodingType.Base64
  }).catch((error) => {
    console.log(error);
  });
}
 
async function copyFromExpoFSToLocalFS() {
  try {
    if (Platform.OS === "ios") {
      await Sharing.shareAsync(expoFileLocation);
    }
    else {
      const { status } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);
      if (status === "granted") {
          const asset = await MediaLibrary.createAssetAsync(expoFileLocation);
          await MediaLibrary.createAlbumAsync("Monitor-Downloads", asset, false);
          alert("Download finished");
      }
    }
  }
  catch(error) {
    console.log(error);
  }
}
 
export default function ListItemVertical({ name, image_url }) {
  var {getSavedToken} = React.useContext(AuthContext);
  var username = React.useContext(userContext);
  console.log(username);
  return(
    <TouchableOpacity
      onPress = {async () => {
        let token = await getSavedToken();
        await getFile(name,token,username);
      }}
    >
      <View style={styles.container}>
        <Image
          source={require("../../../assets/file-icon.jpg")}
          style={styles.photo}
        />
        <View style={styles.container_text}>
          <Text style={styles.title}>{name}</Text>
        </View>
        <Image 
          source={require("../../../assets/download-icon.jpg")}
          style={{width: 25, height: 25}}
        />
      </View>
    </TouchableOpacity>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    padding: 10,
    marginLeft: 16,
    marginRight: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 5,
    backgroundColor: "#FFF",
    elevation: 2,
    alignItems: 'center'
  },
  title: {
    fontSize: 16,
    color: "#0D47A1",
    fontWeight: "bold",
  },
  container_text: {
    flex: 1,
    flexDirection: "column",
    marginLeft: 12,
    justifyContent: "center",
  },
  description: {
    fontSize: 11,
    fontStyle: "italic",
  },
  photo: {
    height: 50,
    width: 50,
  },
});