FROM cloudron/base:0.9.0
MAINTAINER Guacamole Developers <support@cloudron.io>

EXPOSE 8000

RUN apt-get update \
    && apt-get -y install libcairo2-dev libjpeg-turbo8-dev libpng12-dev libossp-uuid-dev \
       libavcodec-dev libavutil-dev libswscale-dev libfreerdp-dev libpango1.0-dev libssh2-1-dev \
       libtelnet-dev libvncserver-dev libpulse-dev libssl-dev libvorbis-dev libwebp-dev \ 
       tomcat8 freerdp ghostscript

ENV VERSION 0.9.10-incubating
ENV MYSQL_CONNECTOR_VERSION 5.1.40
ENV DOWNLOAD_URL "http://apache.org/dyn/closer.cgi?action=download&filename=incubator/guacamole/${VERSION}"

RUN mkdir -p /app/code
WORKDIR /app/code

# Compile the server
RUN wget "$DOWNLOAD_URL/source/guacamole-server-${VERSION}.tar.gz" -O - | tar -xz \
    && cd guacamole-server-${VERSION} \
    && ./configure --prefix=/app/code \
    && make \
    && make install \
    && cd .. \
    && rm -rf guacamole-server-${VERSION}

# Download extensions
RUN mkdir -p /app/code/extensions \
    && wget "$DOWNLOAD_URL/binary/guacamole-auth-ldap-${VERSION}.tar.gz" -O - | tar -xz \
    && wget "$DOWNLOAD_URL/binary/guacamole-auth-jdbc-${VERSION}.tar.gz" -O - | tar -xz \
    && mv guacamole-auth-ldap-${VERSION}/guacamole-auth-ldap-${VERSION}.jar /app/code/extensions \
    && mv guacamole-auth-jdbc-${VERSION}/mysql/guacamole-auth-jdbc-mysql-${VERSION}.jar /app/code/extensions \
    && mv guacamole-auth-jdbc-${VERSION}/mysql/schema /app/code/schema \
    && rm -rf guacamole-auth-ldap-${VERSION} guacamole-auth-jdbc-${VERSION}

# Download MySQL connector
RUN mkdir -p /app/code/lib \
    && wget https://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-java-${MYSQL_CONNECTOR_VERSION}.tar.gz -O - | tar -xz \
    && mv mysql-connector-java-${MYSQL_CONNECTOR_VERSION}/mysql-connector-java-${MYSQL_CONNECTOR_VERSION}-bin.jar /app/code/lib \
    && rm -rf mysql-connector-java-${MYSQL_CONNECTOR_VERSION}

# Get WAR app
RUN mkdir -p /app/code/war \
    && wget "$DOWNLOAD_URL/binary/guacamole-${VERSION}.war" -O /app/code/war/ROOT.war \
    && ln -s /app/code/war /usr/share/tomcat8/webapps

# Configure Tomcat
RUN ln -s /run/tomcat/temp /usr/share/tomcat8/temp \
    && ln -s /etc/tomcat8 /usr/share/tomcat8/conf \
    && ln -s /run/guacamole/guacamole.properties /app/code/guacamole.properties
    
ENV GUACAMOLE_HOME /app/code

ADD start.sh /app/code/start.sh

CMD [ "/app/code/start.sh" ]
