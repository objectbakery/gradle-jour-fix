package app.config;

import org.javalite.activeweb.freemarker.AbstractFreeMarkerConfig;
import java.util.Locale;


public class FreeMarkerConfig extends org.javalite.activeweb.freemarker.AbstractFreeMarkerConfig {
    @Override
    public void init() {

        //this is to override a strange FreeMarker default processing of numbers
        getConfiguration().setNumberFormat("0.##");

        getConfiguration().setEncoding(Locale.GERMAN, "UTF-8");
        getConfiguration().setDefaultEncoding("UTF-8");
        getConfiguration().setOutputEncoding("UTF-8");

        // allow null values for ${foo} otherwise use ${foo?if_exists}
        //getConfiguration().setStrictSyntaxMode(false);
    }
}