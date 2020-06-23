#!/bin/bash

set -eu

mkdir -p /run/guacamole
cat > /run/guacamole/guacamole.properties <<EOF
ldap-hostname:${CLOUDRON_LDAP_SERVER}
ldap-port:${CLOUDRON_LDAP_PORT}
ldap-search-bind-dn:${CLOUDRON_LDAP_BIND_DN}
ldap-search-bind-password:${CLOUDRON_LDAP_BIND_PASSWORD}
ldap-user-base-dn:${CLOUDRON_LDAP_USERS_BASE_DN}
ldap-group-base-dn:${CLOUDRON_LDAP_GROUPS_BASE_DN}
ldap-username-attribute:username
mysql-hostname:${CLOUDRON_MYSQL_HOST}
mysql-port:${CLOUDRON_MYSQL_PORT}
mysql-database:${CLOUDRON_MYSQL_DATABASE}
mysql-username:${CLOUDRON_MYSQL_USERNAME}
mysql-password:${CLOUDRON_MYSQL_PASSWORD}
EOF

mkdir -p /run/tomcat/temp /run/tomcat/logs /run/tomcat/work /run/tomcat/webapps
cp -a /app/code/guacamole-web /run/tomcat/webapps/ROOT


MYSQL="mysql -u ${CLOUDRON_MYSQL_USERNAME} -p${CLOUDRON_MYSQL_PASSWORD} -h ${CLOUDRON_MYSQL_HOST} --port ${CLOUDRON_MYSQL_PORT} --database ${CLOUDRON_MYSQL_DATABASE}"

$MYSQL < /app/code/schema/001-create-schema.sql \
&& $MYSQL < /app/code/schema/002-create-admin-user.sql \
|| true

/app/code/sbin/guacd

export JAVA_OPTS="-Djava.awt.headless=true -XX:MaxRAM=256M -Djava.security.egd=file:/dev/urandom"

exec /usr/share/tomcat8/bin/catalina.sh run
