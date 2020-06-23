FROM cloudron/base:2.0.0@sha256:f9fea80513aa7c92fe2e7bf3978b54c8ac5222f47a9a32a7f8833edf0eb5a4f4


EXPOSE 8000

ARG PREFIX_DIR=/app/code/guacamole


# Build arguments
ARG BUILD_DIR=/tmp/guacd-docker-BUILD
ARG BUILD_DEPENDENCIES="              \
        autoconf                      \
        automake                      \
        freerdp2-dev                  \
        libvorbis-dev                 \
        gcc                           \
        libcairo2-dev                 \
        libjpeg-turbo8-dev            \
        libossp-uuid-dev              \
        libpango1.0-dev               \
        libpulse-dev                  \
        libssh2-1-dev                 \
        libssl-dev                    \
        libtelnet-dev                 \
        libtool                       \
        libvncserver-dev              \
        libwebsockets-dev             \
        libwebp-dev                   \
        tomcat8                       \
        libavcodec-dev                \
        libavutil-dev                 \
        libswscale-dev                \
        libpng-dev                    \
        make"

# Bring build environment up to date and install build dependencies

ARG BUILD_NEW_DEPS="build-essential libcairo2-dev libossp-uuid-dev libavcodec-dev libavutil-dev \
libswscale-dev freerdp2-dev libpango1.0-dev libssh2-1-dev libtelnet-dev libvncserver-dev libpulse-dev libssl-dev \
libvorbis-dev libwebp-dev libwebsockets-dev wget libtool-bin tomcat8"

RUN add-apt-repository -yn universe && \
    apt-get -qq update                         && \
    apt-get install -y $BUILD_NEW_DEPS && \
    rm -rf /var/lib/apt/lists/*

ARG RUNTIME_DEPENDENCIES="            \
        ca-certificates               \
        ghostscript                   \
        fonts-liberation              \
        fonts-dejavu                  \
        xfonts-terminus"


# Bring runtime environment up to date and install runtime dependencies
RUN apt-get update                                          && \
    apt-get install -y $RUNTIME_DEPENDENCIES                && \
    rm -rf /var/lib/apt/lists/*

ENV VERSION 1.1.0
ENV MYSQL_CONNECTOR_VERSION 5.1.40
ENV DOWNLOAD_URL "http://apache.org/dyn/closer.cgi?action=download&filename=guacamole/${VERSION}"

RUN mkdir -p /app/code
WORKDIR /app/code

# Compile the server
RUN wget "$DOWNLOAD_URL/source/guacamole-server-${VERSION}.tar.gz" -O - | tar -xz \
    && cd guacamole-server-${VERSION} \
    && ./configure --prefix=/app/code \
    #&& ./configure --with-init-dir=/etc/init.d \
    && make \
    && make install \
    && ldconfig \
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
RUN wget "$DOWNLOAD_URL/binary/guacamole-${VERSION}.war" -O /app/code/guacamole.war \
    && mkdir /app/code/guacamole-web \
    && cd /app/code/guacamole-web \
    && unzip /app/code/guacamole.war \
    && rm /app/code/guacamole.war

# Configure Tomcat
RUN ln -s /run/tomcat/temp /usr/share/tomcat8/temp \
    && ln -s /run/tomcat/logs /usr/share/tomcat8/logs \
    && ln -s /run/tomcat/work /usr/share/tomcat8/work \
    && ln -s /etc/tomcat8 /usr/share/tomcat8/conf \
    && ln -s /run/guacamole/guacamole.properties /app/code/guacamole.properties \
    && ln -s /run/tomcat/webapps /usr/share/tomcat8/webapps
    
ENV GUACAMOLE_HOME /app/code

ADD start.sh /app/code/start.sh

CMD [ "/app/code/start.sh" ]
