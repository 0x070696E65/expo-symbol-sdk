import { decode } from "utf8";
import * as utilities from "./convert-utils";

export class Convert {
  /**
   * Decodes two hex characters into a byte.
   * @param {string} char1 The first hex digit.
   * @param {string} char2 The second hex digit.
   * @returns {number} The decoded byte.
   */
  public static toByte = (char1: string, char2: string): number => {
    const byte = utilities.tryParseByte(char1, char2);
    if (undefined === byte) {
      throw Error(`unrecognized hex char, char1:${char1}, char2:${char2}`);
    }
    return byte;
  };

  /**
   * Determines whether or not a string is a hex string.
   * @param input The string to test.
   * @param expectedSize the expected size of the input
   * @returns true if the input is a hex string, false otherwise.
   */
  public static isHexString = (input: string, expectedSize = 0): boolean => {
    if (0 !== input.length % 2) {
      return false;
    }
    for (let i = 0; i < input.length; i += 2) {
      if (undefined === utilities.tryParseByte(input[i], input[i + 1])) {
        return false;
      }
    }
    if (expectedSize && expectedSize !== input.length) {
      return false;
    }
    return true;
  };

  /**
   * Validates if a string is a valid hex of the expected size.
   * @param input The string to test.
   * @param expectedSize the expected size of the input
   * @param message error message.
   */
  public static validateHexString = (input: string, expectedSize: number, message: string): void => {
    if (!Convert.isHexString(input, expectedSize)) {
      throw new Error(`${message}. Value ${input} is not an hex string of size ${expectedSize}.`);
    }
  };

  /**
   * Converts a hex string to a uint8 array.
   * @param {string} input A hex encoded string.
   * @returns {Uint8Array} A uint8 array corresponding to the input.
   */
  public static hexToUint8 = (input: string): Uint8Array => {
    if (0 !== input.length % 2) {
      throw Error(`hex string has unexpected size '${input.length}'`);
    }
    const output = new Uint8Array(input.length / 2);
    for (let i = 0; i < input.length; i += 2) {
      output[i / 2] = Convert.toByte(input[i], input[i + 1]);
    }
    return output;
  };

  /**
   * Reversed convertion hex string to a uint8 array.
   * @param input A hex encoded string.
   * @returns A uint8 array corresponding to the input.
   */
  public static hexToUint8Reverse = (input: string): Uint8Array => {
    if (0 !== input.length % 2) {
      throw Error(`hex string has unexpected size '${input.length}'`);
    }
    const output = new Uint8Array(input.length / 2);
    for (let i = 0; i < input.length; i += 2) {
      output[output.length - 1 - i / 2] = Convert.toByte(input[i], input[i + 1]);
    }
    return output;
  };

  /**
   * Converts a uint8 array to a hex string.
   * @param input A uint8 array.
   * @returns A hex encoded string corresponding to the input.
   */
  public static uint8ToHex = (input: Uint8Array): string => {
    let s = "";
    for (const byte of input) {
      s += utilities.Nibble_To_Char_Map[byte >> 4];
      s += utilities.Nibble_To_Char_Map[byte & 0x0f];
    }

    return s;
  };

  /**
   * Converts a uint8 array to a uint32 array.
   * @param input A uint8 array.
   * @returns A uint32 array created from the input.
   */
  public static uint8ToUint32 = (input: Uint8Array): Uint32Array => new Uint32Array(input.buffer);

  /**
   * Converts a uint32 array to a uint8 array.
   * @param input A uint32 array.
   * @returns A uint8 array created from the input.
   */
  public static uint32ToUint8 = (input: Uint32Array): Uint8Array => new Uint8Array(input.buffer);

  /** Converts an unsigned byte to a signed byte with the same binary representation.
   * @param input An unsigned byte.
   * @returns A signed byte with the same binary representation as the input.
   *
   */
  public static uint8ToInt8 = (input: number): number => {
    if (0xff < input) {
      throw Error(`input '${input}' is out of range`);
    }
    return (input << 24) >> 24;
  };

  /** Converts a signed byte to an unsigned byte with the same binary representation.
   * @param input A signed byte.
   * @returns An unsigned byte with the same binary representation as the input.
   */
  public static int8ToUint8 = (input: number): number => {
    if (127 < input || -128 > input) {
      throw Error(`input '${input}' is out of range`);
    }
    return input & 0xff;
  };

  /**
   * Convert UTF-8 to hex
   * @param input - An UTF-8 string
   */
  public static utf8ToHex = (input: string): string => {
    return Buffer.from(input, "utf-8").toString("hex").toUpperCase();
  };

  /**
   * Convert UTF-8 string to Uint8Array
   * @param input - An string with UTF-8 encoding
   */
  public static utf8ToUint8 = (input: string): Uint8Array => {
    const hex = Convert.utf8ToHex(input);
    return Convert.hexToUint8(hex);
  };

  /**
   * Convert Uint8Array to string with UTF-8 encoding
   * @param input - An UTF-8 string
   */
  public static uint8ToUtf8 = (input: Uint8Array): string => {
    // return new TextDecoder().decode(input);
    const hex = Convert.uint8ToHex(input);
    return Convert.decodeHex(hex);
  };

  /**
   * decode hex to uft8 string
   * @param hex - Hex input
   */
  public static decodeHex = (hex: string): string => {
    let str = "";
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    try {
      return decode(str);
    } catch (e) {
      return str;
    }
  };

  /**
   * Generate xor for two byte arrays and return in hex string
   * @param value1 - Value 1 bytes
   * @param value2  - Value 2 bytes
   * @return {string} - delta value in Hex
   */
  public static xor(value1: Uint8Array, value2: Uint8Array): string {
    const buffer1 = Buffer.from(value1.buffer as ArrayBuffer);
    const buffer2 = Buffer.from(value2.buffer as ArrayBuffer);
    const length = Math.max(buffer1.length, buffer2.length);
    const delta: number[] = [];
    for (let i = 0; i < length; ++i) {
      const xorBuffer = buffer1[i] ^ buffer2[i];
      delta.push(xorBuffer);
    }
    return Convert.uint8ToHex(Uint8Array.from(delta));
  }

  /**
   * It splits the number's bytes into a an array.
   * @param number the number
   * @param arraySize the expected size of the array.
   */
  public static numberToUint8Array(number: number, arraySize: number): Uint8Array {
    const uint8Array = new Uint8Array(arraySize);
    for (let index = 0; index < uint8Array.length; index++) {
      const byte = number & 0xff;
      uint8Array[index] = byte;
      number = (number - byte) / 256;
    }
    return uint8Array;
  }

  /**
   * It creates a number from the bytes in the array.
   * @param array the number from the bytes.
   */
  public static uintArray8ToNumber(array: Uint8Array): number {
    let value = 0;
    for (let index = 0; index < array.length; index++) {
      value += array[index] << (index * 8);
    }
    return value >>> 0;
  }
}
