

Create `.env` file and setup environment variable as flow。

Mount `.env` to docker container, the eliza server with read `.env` and init each modules with startup。

| Variable                  | desc                                                         |
| ------------------------- | ------------------------------------------------------------ |
| FUSS_API_URL              | fuss endpoint                                                |
| FUSS_AGENT_TYPE           | fuss agent role，the value with pass as paramter 'role' with endpoint is called |
| FUSS_AGENT_ID             | Represents a UUID string in the format "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" |
| MONGODB_CONNECTION_STRING | mongodb connection string，eg：mongodb://root:password@35.88.132.54:8002/?directConnection=true |
| MONGODB_DATABASE          | name of the database in mongoDB atlas #default: 'elizaAgent' |
| TWITTER_DRY_RUN           |                                                              |
| TWITTER_USERNAME          |                                                              |
| TWITTER_PASSWORD          |                                                              |
| TWITTER_EMAIL             |                                                              |
| TWITTER_2FA_SECRET        |                                                              |
| TWITTER_POLL_INTERVAL     | how often (in seconds) the bot should check for interactions |
| TWITTER_SEARCH_ENABLE     | Enable timeline search, WARNING this greatly increases your chance of getting banned |
| TWITTER_TARGET_USERS      | Comma separated list of Twitter user names to interact with  |
| TWITTER_RETRY_LIMIT       | Maximum retry attempts for Twitter login                     |
| TWITTER_SPACES_ENABLE     | Enable or disable Twitter Spaces logic                       |



## EKS
aws eks update-kubeconfig --name eliza-agent-fuss-test --region us-west-2


```
cat <<EOF > aws-auth-cm.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: aws-auth
  namespace: kube-system
data:
  mapRoles: |
    - rolearn: arn:aws:iam::050752637092:role/AmazonEKSAutoNodeRole
      username: system:node:{{EC2PrivateDNSName}}
      groups:
        - system:bootstrappers
        - system:nodes
  mapUsers: |
    - arn:aws:iam::050752637092:user/yang_chen
      username: yang_chen
      groups:
        - system:masters
    - arn:aws:iam::050752637092:user/weiqi_wang
      username: weiqi_wang
      groups:
        - system:masters
EOF
```

## apply config
kubectl apply -f aws-auth-cm.yaml 