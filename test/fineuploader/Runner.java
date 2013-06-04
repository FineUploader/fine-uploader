package fineuploader;

import org.eclipse.jetty.server.Connector;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.SessionManager;
import org.eclipse.jetty.server.nio.SelectChannelConnector;
import org.eclipse.jetty.util.component.AbstractLifeCycle;
import org.eclipse.jetty.util.component.LifeCycle;
import org.eclipse.jetty.webapp.WebAppContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Runner
{
	final static Logger log = LoggerFactory.getLogger(Runner.class);

	public static void main(String[] args) throws Exception
	{
		Server server = new Server();

		Connector connector = new SelectChannelConnector();

        connector.setPort(8080);

		server.setConnectors(new Connector[]{connector});

		WebAppContext context = new WebAppContext();
		context.setContextPath("/");
        context.setResourceBase(System.getProperty("user.dir"));
		context.setInitParameter(SessionManager.__CheckRemoteSessionEncoding, "true"); // Stops Jetty from adding 'jsessionid' URL rewriting into non-local URLs (e.g. Google OpenId redirects)

		server.setHandler(context);

		server.addLifeCycleListener(new AbstractLifeCycle.AbstractLifeCycleListener()
		{
			@Override
			public void lifeCycleStarted(LifeCycle event)
			{
				log.warn("Jetty ready to accept requests...");
			}
		});

		server.start();

		server.join();
	}
}
