#!/bin/bash

set -eu

mkdir -p /run/guacamole
cat > /run/guacamole/guacamole.properties <<EOF
ldap-hostname:${LDAP_SERVER}
ldap-port:${LDAP_PORT}
ldap-search-bind-dn:${LDAP_BIND_DN}
ldap-search-bind-password:${LDAP_BIND_PASSWORD}
ldap-user-base-dn:${LDAP_USERS_BASE_DN}
ldap-group-base-dn:${LDAP_GROUPS_BASE_DN}
ldap-username-attribute:username
mysql-hostname:${MYSQL_HOST}
mysql-port:${MYSQL_PORT}
mysql-database:${MYSQL_DATABASE}
mysql-username:${MYSQL_USERNAME}
mysql-password:${MYSQL_PASSWORD}
EOF

mkdir -p /run/tomcat/temp /run/tomcat/logs /run/tomcat/work /run/tomcat/webapps
cp -a /app/code/guacamole-web /run/tomcat/webapps/ROOT


MYSQL="mysql -u ${MYSQL_USERNAME} -p${MYSQL_PASSWORD} -h ${MYSQL_HOST} --port ${MYSQL_PORT} --database ${MYSQL_DATABASE}"

$MYSQL < /app/code/schema/001-create-schema.sql \
&& $MYSQL < /app/code/schema/002-create-admin-user.sql \
|| true

/app/code/sbin/guacd

exec /usr/share/tomcat8/bin/catalina.sh run
