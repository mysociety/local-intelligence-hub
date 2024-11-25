#!/bin/bash

bw login
bw get attachment .env --itemid 064abbb1-e41b-4632-be90-b2270105d4d1
bw get attachment nextjs.env --itemid 064abbb1-e41b-4632-be90-b2270105d4d1 --output ./nextjs/.env
