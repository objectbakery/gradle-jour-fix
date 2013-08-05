package de.pinuts.helper;

import java.lang.StringBuilder;
import java.util.List;
import java.util.ArrayList;
import java.lang.Character;
import java.lang.Math;


class StringFun {

    public static String reverse(String text){
	return new StringBuilder(text).reverse().toString();
    }

    public static String shuffle(String text){

	List<Character> characters = new ArrayList<Character>();
        for(char c : text.toCharArray()){
            characters.add(c);
        }
        StringBuilder output = new StringBuilder(text.length());
        while(characters.size()!=0){
            int randPicker = (int)(Math.random()*characters.size());
            output.append(characters.remove(randPicker));
        }

	return output.toString();

    }

}