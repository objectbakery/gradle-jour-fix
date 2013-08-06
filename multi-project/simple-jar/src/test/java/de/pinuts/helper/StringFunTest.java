package de.pinuts.helper;

import static org.junit.Assert.*;

import org.junit.Test;
import org.junit.Ignore;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import static org.junit.Assert.assertEquals;

import org.junit.Test;
import org.junit.Ignore;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

import static org.hamcrest.CoreMatchers.not;
import static org.hamcrest.CoreMatchers.is;

/**
 * Tests for {@link de.pinuts.helper.StringFun}.
 *
 * @author sebastian.barszczewski@pinuts.de 
 */
@RunWith(JUnit4.class)
public class StringFunTest {

    @Test
    public void shouldReverseString() {

	assertEquals("dlroW olleH", de.pinuts.helper.StringFun.reverse("Hello World"));
    }

    @Test
    public void shouldShuffleString() {

	String shuffledText = de.pinuts.helper.StringFun.shuffle("Hello World");
	assertThat(shuffledText, is(not("Hello World")));

	shuffledText = de.pinuts.helper.StringFun.shuffle("Hello World");
	assertThat(shuffledText, is(not("Hello World")));

	shuffledText = de.pinuts.helper.StringFun.shuffle("Hello World");
	assertThat(shuffledText, is(not("Hello World")));

	shuffledText = de.pinuts.helper.StringFun.shuffle("Hello World");
	assertThat(shuffledText, is(not("Hello World")));

	shuffledText = de.pinuts.helper.StringFun.shuffle("Hello World");
	assertThat(shuffledText, is(not("Hello World")));

	shuffledText = de.pinuts.helper.StringFun.shuffle("Hello World");
	assertThat(shuffledText, is(not("Hello World")));
    }

}