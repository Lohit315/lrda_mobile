import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserData } from "../../types";
import { getItem } from "../utils/async_storage";

export class User {
  private static instance: User;
  private userData: UserData | null = null;
  private callback: ((isLoggedIn: boolean) => void) | null = null;

  public static getInstance(): User {
    if (!User.instance) {
      User.instance = new User();
    }
    return User.instance;
  }

  private async persistUser(userData: UserData) {
    try {
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
    } catch (error) {
      console.log(error);
    }
  }

  public setLoginCallback(callback: (isLoggedIn: boolean) => void) {
    this.callback = callback;
  }

  private notifyLoginState() {
    if (this.callback) {
      this.callback(this.userData !== null);
    }
  }

  private async loadUser(): Promise<UserData | null> {
    try {
      const value = await AsyncStorage.getItem("userData");
      if (value !== null) {
        return JSON.parse(value);
      }
    } catch (error) {
      console.log(error);
    }
    return null;
  }

  private async clearUser() {
    try {
      await AsyncStorage.removeItem("userData");
    } catch (error) {
      console.log(error);
    }
  }

  public async login(username: string, password: string): Promise<string> {
    try {
      const response = await fetch(
        "http://lived-religion-dev.rerum.io/deer-lr/login",
        {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          headers: {
            "Content-Type": "application/json;charset=utf-8",
          },
          body: JSON.stringify({
            username: username,
            password: password,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        this.userData = data;
        if (this.userData !== null) {
          await this.persistUser(this.userData);
        }
        this.notifyLoginState();
        return "success";
      } else {
        throw new Error("There was a server error logging in.");
      }
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  public async logout() {
    try {
      await fetch("http://lived-religion-dev.rerum.io/deer-lr/logout", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain",
        },
      })
        .then((response) => {
          if (response.ok) {
            this.userData = null;
            this.clearUser();
            this.notifyLoginState();
            // console.log("User logged out");
          }
        })
        .catch((err) => {
          return err;
        });
    } catch (error) {
      console.log("User did not succesfully log out");
    }
  }

  public async getId(): Promise<string | null> {
    if (!this.userData) {
      this.userData = await this.loadUser();
    }
    return this.userData?.["@id"] ?? null;
  }

  public async getName(): Promise<string | null> {
    if (!this.userData) {
      this.userData = await this.loadUser();
    }
    return this.userData?.name ?? null;
  }

  public async hasOnboarded(): Promise<boolean> {
    const onboarded = await getItem('onboarded');
    return onboarded === '1';
  }
  
  public async getRoles(): Promise<{
    administrator: boolean;
    contributor: boolean;
  } | null> {
    if (!this.userData) {
      this.userData = await this.loadUser();
    }
    return this.userData?.roles ?? null;
  }
}
