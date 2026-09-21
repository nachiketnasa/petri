# Deploying Petri to AWS

Single EC2 instance, $0-intent deployment: no ALB, NAT gateway, RDS, or ECR
(those are the pieces that cost money on an idle personal project). One
`t3.micro` runs both containers via `docker compose`, built directly from
this repo. Remote access is via SSM Session Manager, not SSH — no inbound
port 22.

## 1. Create the AWS account

Sign up at aws.amazon.com (a card is required even for free tier/credits).

New accounts (since mid-2025) get **credits**, not an indefinitely-free
tier — check **Billing → Free Tier / Credits** for the amount and expiry
(typically $100–200 valid 6 months). This setup costs roughly $8–10/month,
so the credit covers a long time, but not forever. Set a billing alarm:
**Budgets → create budget → alert at $5**, so you hear about it before
anything is actually charged.

## 2. Deploy the stack

Install the AWS CLI, then `aws configure` with an access key (IAM → your
user → Security credentials).

Find your account's default VPC ID:

```
aws ec2 describe-vpcs --filters Name=is-default,Values=true --query "Vpcs[0].VpcId" --output text
```

Then create the stack:

```
aws cloudformation create-stack \
  --stack-name petri \
  --template-body file://cloudformation/petri-ec2-stack.yaml \
  --parameters ParameterKey=VpcId,ParameterValue=<vpc-id from above> \
  --capabilities CAPABILITY_IAM
```

Wait a few minutes, then fetch the outputs:

```
aws cloudformation describe-stacks --stack-name petri --query "Stacks[0].Outputs"
```

This gives you `PublicIP` (for DNS) and `InstanceId` (for redeploys).

## 3. Point Cloudflare at it

In the Cloudflare dashboard for `nachiketnasa.com`:

- Add an **A record**: name `petri`, content = the `PublicIP` above, proxy
  status **ON** (orange cloud).
- Under **SSL/TLS**, set encryption mode to **Flexible** — the origin
  serves plain HTTP only, Cloudflare terminates HTTPS for visitors, no
  cert needed on the EC2 side.

Give the instance a minute or two to finish cloning and building images
after the stack reports `CREATE_COMPLETE`, then https://petri.nachiketnasa.com
should be live.

## 4. Redeploying after new commits

No CI/CD pipeline — that's another cost center for a personal project.
Update manually via Session Manager (still no SSH):

```
aws ssm start-session --target <InstanceId>
cd /opt/petri && git pull && sudo docker compose -f docker-compose.prod.yml up -d --build
```

## 5. Tearing it down

```
aws cloudformation delete-stack --stack-name petri
```

Deletes the instance, security group, IAM role, and releases the Elastic
IP — remove the Cloudflare A record separately.
