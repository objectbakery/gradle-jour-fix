
package app.config;

import org.javalite.activeweb.AppContext;

import com.google.inject.Guice;
import org.javalite.activeweb.Bootstrap;
import org.javalite.activeweb.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Igor Polevoy
 */
public class AppBootstrap extends Bootstrap {

    private Logger log = LoggerFactory.getLogger(AppBootstrap.class);

    public void init(AppContext context) {

        log.info("Simple webapp base url template is booting");
    }
}
